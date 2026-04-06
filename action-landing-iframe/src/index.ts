import type { IframeEvent } from "../../shared/types";

/**
 * TODO: Get expected parent origin and use it here instead of "*" (but this is not a security issue as we are not passing data to the parent)
 * TODO: If this is not an iframe, instead fetch the session object and redirect to the target URL based on the status in the query string
 */

function insecurePostMessage<T extends IframeEvent>(message: T) {
  window.parent.postMessage(message, "*");
}

const queryString = new URLSearchParams(window.location.search);

// const hosts: Record<string, string | undefined> = {
//   pl: process.env.XENDIT_CHECKOUT_UI_GATEWAY_PROD_LIVE,
//   pd: process.env.XENDIT_CHECKOUT_UI_GATEWAY_PROD_DEV,
//   sl: process.env.XENDIT_CHECKOUT_UI_GATEWAY_STAGING_LIVE,
//   sd: process.env.XENDIT_CHECKOUT_UI_GATEWAY_STAGING_DEV,
// };
// const targetHost = hosts[queryString.get("env") || "pl"];
// const sessionAuthKey = queryString.get("session_auth_id");

const componentStatus = queryString.get("component_status");

const isIframe = window.self !== window.top;

if (isIframe) {
  // this is an iframe
  insecurePostMessage({
    type: "xendit-iframe-action-complete",
  });
} else {
  // const getSessionUrl = new URL(`/api/sessions/${sessionAuthKey}`, targetHost);
  // fetch(getSessionUrl.toString())
  //   .then((response) => response.json())
  //   .then((session) => {
  //     const returnUrl = session.component_configuration.return_url;
  //     if (returnUrl) {
  //       window.location.href = session.component_configuration.return_url;
  //     } else {
  if (componentStatus === "SUCCESS") {
    window.location.href = "https://xendit.co/success";
  } else if (componentStatus === "FAILURE") {
    window.location.href = "https://xendit.co/failure";
  } else {
    console.error("Missing component_status query parameter");
  }
  //   }
  // });
}
