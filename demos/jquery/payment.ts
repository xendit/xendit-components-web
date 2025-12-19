import $ from "jquery";
import { XenditComponents, XenditComponentsTest } from "xendit-components";
import { goToPage } from "./store";

let sdk: XenditComponents;

/**
 * Begins the checkout process by initializing the Xendit Session SDK
 */
export function beginCheckout() {
  $(".xendit-component-container").empty();

  const sessionClientKey = prompt(
    "Enter your Components SDK Key (or leave blank to use the test SDK):",
  );
  if (sessionClientKey === null) {
    goToPage(".store");
    return;
  }

  if (sessionClientKey === "") {
    // Using the test SDK class
    sdk = new XenditComponentsTest({});
  } else {
    sdk = new XenditComponents({
      sessionClientKey,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).sdk = sdk;

  $(sdk).on("fatal-error", function (event) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    alert(`Fatal error occurred: ${(event.originalEvent as any).message}`);
    goToPage(".checkout");
  });

  $(".loading").show();
  $(sdk).on("init", function () {
    $(".loading").hide();
    $(".submit").show();

    // create cards component
    const channel = sdk
      .getActiveChannels()
      .find((c) => c.channelCode === "CARDS");
    if (channel) {
      const component = sdk.createChannelComponent(channel);
      $(".xendit-component-container")[0].replaceChildren(component);
    }
  });

  $(sdk).on("submission-begin", function () {
    $(".loading").show();
  });
  $(sdk).on("submission-end", function () {
    $(".loading").hide();
  });

  $(sdk).on("session-complete", () => {
    goToPage(".payment-success");
  });

  $(sdk).on("session-expired-or-canceled", () => {
    alert("Session has expired or was canceled.");
    goToPage(".store");
  });
}

/**
 * Submits the checkout/payment form
 */
export function submitCheckout() {
  sdk.submit();
}
