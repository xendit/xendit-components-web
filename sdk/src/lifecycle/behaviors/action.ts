import { createElement, render, ComponentChildren } from "preact";
import { IframeActionCompleteEvent } from "../../../../shared/types";
import {
  InternalBehaviorTreeUpdateEvent,
  InternalScheduleMockUpdateEvent,
} from "../../private-event-types";
import { XenditWillRedirectEvent } from "../../public-event-types";
import {
  makeTestPollResponseForFailure,
  makeTestPollResponseForSuccess,
} from "../../test-data";
import { assert, assertEquals } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
import { ActionIframe } from "../../components/action-iframe";
import { ActionQr } from "../../components/action-qr";
import { internal } from "../../internal";
import DefaultActionContainer from "../../components/default-action-container";

abstract class ContainerActionBehavior implements Behavior {
  cleanupFn: ((cancelledByUser: boolean) => void) | null = null;
  defaultContainerHeight = 0;
  defaultContainerWidth = 400;
  title = "Complete your payment";

  constructor(protected bb: BlackboardType) {}

  /**
   * Creates a default action container if the user has not created one already.
   * Returns a cleanup function that destroys the default action container if it was created.
   */
  ensureHasActionContainer() {
    if (this.bb.sdk[internal].liveComponents.actionContainer) {
      // user created action container already
      // TODO: validate it's in the dom and the right size
      return () => {
        this.emptyActionContainer();
      };
    }

    let cleanedUp = false;
    let success = false;

    const container = document.createElement("div");
    container.setAttribute("class", "xendit-default-action-container");

    const props = {
      sdk: this.bb.sdk,
      title: this.title,
      width: this.defaultContainerWidth,
      height: this.defaultContainerHeight,
      onClose: () => {
        cleanedUp = true;
        render(null, container);
        container.remove();
        if (!success) {
          this.bb.sdk.abortSubmission();
        }
      },
    };
    render(createElement(DefaultActionContainer, props), container);
    document.body.appendChild(container);

    // Cleanup function
    // (if actionCancelledByUser is true, abort the submission after the modal closes)
    return (actionCancelledByUser: boolean) => {
      if (!actionCancelledByUser) {
        success = true;
      }

      if (cleanedUp) return;

      // make the dialog play its close animation before removing it
      render(
        createElement(DefaultActionContainer, {
          ...props,
          close: true,
        }),
        container,
      );
    };
  }

  cleanupActionContainer(cancelledByUser: boolean) {
    if (this.cleanupFn) {
      this.cleanupFn(cancelledByUser);
      this.cleanupFn = null;
    }
  }

  emptyActionContainer() {
    const container = this.bb.sdk[internal].liveComponents.actionContainer;
    if (container) {
      render(null, container);
    }
  }

  /**
   * Populates the action container with the provided component.
   * This method handles the common logic of getting the container and rendering the component.
   */
  populateActionContainer(createComponent: () => ComponentChildren) {
    const container = this.bb.sdk[internal].liveComponents.actionContainer;
    if (!container) {
      throw new Error(
        "Trying to populate action container, but it is missing; A default action container should have been created. This is a bug, please contact support.",
      );
    }

    render(createComponent(), container);
  }

  exit() {
    this.cleanupActionContainer(false);
    this.emptyActionContainer();
  }
}

export class ActionCompletedBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}
  enter() {}
}

export class ActionRedirectBehavior implements Behavior {
  constructor(
    private bb: BlackboardType,
    private url: string,
  ) {}

  enter() {
    this.bb.dispatchEvent(new XenditWillRedirectEvent());
    window.location.href = this.url;
  }
}

export class ActionIframeBehavior extends ContainerActionBehavior {
  constructor(
    protected bb: BlackboardType,
    private url: string,
  ) {
    super(bb);
    this.defaultContainerHeight = 600;
  }

  enter() {
    this.cleanupFn = this.ensureHasActionContainer();
    this.populateActionContainer(() =>
      createElement(ActionIframe, {
        url: this.url,
        mock: this.bb.mock,
        onIframeComplete: (event: IframeActionCompleteEvent) => {
          this.cleanupActionContainer(false);
          this.updateMocksOnIframeCompletion(event.mockStatus === "success");

          // setting actionCompleted will ensure the action UI isn't shown again
          this.bb.actionCompleted = true;
          // request immediate poll on next update
          this.bb.pollImmediatelyRequested = true;

          this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
        },
      }),
    );
  }

  updateMocksOnIframeCompletion(success: boolean) {
    assert(this.bb.world?.paymentEntity);
    if (this.bb.mock) {
      if (success) {
        this.bb.dispatchEvent(
          new InternalScheduleMockUpdateEvent(
            makeTestPollResponseForSuccess(
              this.bb.world.session,
              this.bb.world.paymentEntity,
            ),
          ),
        );
      } else {
        this.bb.dispatchEvent(
          new InternalScheduleMockUpdateEvent(
            makeTestPollResponseForFailure(
              this.bb.world.session,
              this.bb.world.paymentEntity,
            ),
          ),
        );
      }
    }
  }
}

export class ActionQrBehavior extends ContainerActionBehavior {
  constructor(
    protected bb: BlackboardType,
    private actionIndex: string,
  ) {
    super(bb);
  }

  enter() {
    const qrAction =
      this.bb.world?.paymentEntity?.entity.actions[Number(this.actionIndex)];

    assertEquals(qrAction?.type, "PRESENT_TO_CUSTOMER");
    assert(this.bb.world);
    assert(this.bb.channel);

    const container = this.bb.sdk[internal].liveComponents.actionContainer;

    const actionQrProps = {
      amount: this.bb.world.session.amount,
      channelLogo: this.bb.channel.brand_logo_url,
      currency: this.bb.world.session.currency,
      hideUi: container?.getAttribute("data-qr-code-only") === "true" || false,
      mock: this.bb.mock,
      onAffirm: this.affirmPayment.bind(this),
      qrString: qrAction.value,
      t: this.bb.sdk.t.bind(this.bb.sdk),
      title: qrAction.action_subtitle,
    };

    this.title = qrAction.action_title;
    this.cleanupFn = this.ensureHasActionContainer();
    this.populateActionContainer(() => createElement(ActionQr, actionQrProps));
  }

  /**
   * Fired when user affirms they have made the payment by clicking
   * the affirm button.
   */
  affirmPayment() {
    if (this.bb.mock) {
      this.updateMocksOnSimulatePaymentCompletion();
    } else {
      if (this.bb.sdkKey.hostId === "pl") {
        // live mode
        this.bb.pollImmediatelyRequested = true;
      } else {
        this.bb.simulatePaymentRequested = true;
      }
    }
  }

  updateMocksOnSimulatePaymentCompletion() {
    assert(this.bb.world?.paymentEntity);
    if (this.bb.mock) {
      this.bb.dispatchEvent(
        new InternalScheduleMockUpdateEvent(
          makeTestPollResponseForSuccess(
            this.bb.world.session,
            this.bb.world.paymentEntity,
          ),
        ),
      );
    }
  }
}
