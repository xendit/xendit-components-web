import { createElement, render, ComponentChildren } from "preact";
import { assert } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
import { internal } from "../../internal";
import DefaultActionContainer from "../../components/default-action-container";

export enum DefaultActionContainerType {
  QrWithCustomArt = "qr-with-custom-art",
  Generic = "generic",
}

// How long a merchant-provided action container keeps its contents after the action ends.
export const MERCHANT_CONTAINER_DESTROY_DELAY_MS = 2000;

export abstract class ContainerActionBehavior implements Behavior {
  cleanupFn: ((cancelledByUser: boolean) => void) | null = null;
  defaultContainerHeight = 0;
  defaultContainerWidth = 400;
  title = "Complete your payment";

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
      // clear the previous action's contents before reusing container
      this.flushPendingContainerDestroy();
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

  // Cancels a pending delayed destroy and clears the contents.
  flushPendingContainerDestroy() {
    const state = this.bb.sdk[internal].liveComponents;
    if (state.actionContainerDestroyTimer === null) return;

    clearTimeout(state.actionContainerDestroyTimer);
    state.actionContainerDestroyTimer = null;
    if (state.actionContainer) {
      render(null, state.actionContainer);
    }
  }

  emptyActionContainer() {
    const container = this.bb.sdk[internal].liveComponents.actionContainer;
    if (!container) return;

    const state = this.bb.sdk[internal].liveComponents;
    state.actionContainerDestroyTimer = setTimeout(() => {
      state.actionContainerDestroyTimer = null;
      if (state.actionContainer !== container) return;
      render(null, container);
    }, MERCHANT_CONTAINER_DESTROY_DELAY_MS);
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

    render(createComponent(), container);
  }

  exit() {
    this.cleanupActionContainer(false);
  }
}
