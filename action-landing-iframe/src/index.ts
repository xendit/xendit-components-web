import type { IframeEvent } from "../../shared/types";

/**
 * TODO: Get expected parent origin and use it here instead of "*" (but this is not a security issue as we are not passing data to the parent)
 * TODO: If this is not an iframe, instead fetch the session object and redirect to the target URL based on the status in the query string
 */

function insecurePostMessage<T extends IframeEvent>(message: T) {
  window.parent.postMessage(message, "*");
}

insecurePostMessage({
  type: "xendit-iframe-action-complete",
});
