import { createElement, render, ComponentChildren } from "preact";
import { assert } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
import { internal } from "../../internal";
import DefaultActionContainer from "../../components/default-action-container";
import { SessionTelemetryScope } from "../../telemetry";

export enum DefaultActionContainerType {
  QrWithCustomArt = "qr-with-custom-art",
  Generic = "generic",
}

export abstract class ContainerActionBehavior implements Behavior {
  cleanupFn: ((cancelledByUser: boolean) => void) | null = null;
  defaultContainerHeight = 0;
  defaultContainerWidth = 400;
  title = "Complete your payment";

  telemetryScope: SessionTelemetryScope | null = null;

  constructor(protected bb: BlackboardType) {}

  /**
   * Creates a default action container if the user has not created one already.
   * Returns a cleanup function that destroys the default action container if it was created.
   */
  ensureHasActionContainer(
    defaultActionContainerType: DefaultActionContainerType = DefaultActionContainerType.Generic,
  ) {
    assert(this.bb.channel);

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

    const props: Parameters<typeof DefaultActionContainer>[0] = {
      sdk: this.bb.sdk,
      title: this.title,
      width: this.defaultContainerWidth,
      height: this.defaultContainerHeight,
      borderColor: undefined, // needs some design feedback
      // borderColor: this.bb.channel.brand_color,
      defaultActionContainerType,
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

  updateActionContainerBrandColor() {
    assert(this.bb.channel);

    const container = this.bb.sdk[internal].liveComponents.actionContainer;
    if (container) {
      container.style.setProperty(
        "--xendit-channel-brand-color",
        this.bb.channel.brand_color,
      );
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

    this.updateActionContainerBrandColor();

    // telemetry for start of action
    this.telemetryScope = this.bb.telemetry.appendAndPushScope({
      stage: "CHECKOUT_ACTION_BEGIN",
      success: true,
    });

    render(createComponent(), container);
  }

  exit() {
    this.cleanupActionContainer(false);
    this.emptyActionContainer();

    // telemetry for end of action
    if (this.telemetryScope) {
      this.bb.telemetry.append({
        stage: "CHECKOUT_ACTION_CLOSE",
        success: true,
      });
      this.bb.telemetry.popScope(this.telemetryScope);
      this.telemetryScope = null;
    }
  }
}
