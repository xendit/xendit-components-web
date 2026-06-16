import type { IframeEvent } from "../../shared/types";

/**
 * TODO: Get expected parent origin and use it here instead of "*" (but this is not a security issue as we are not passing data to the parent)
 * TODO: If this is not an iframe, instead fetch the session object and redirect to the target URL based on the status in the query string
 */

function insecurePostMessage<T extends IframeEvent>(message: T) {
  window.parent.postMessage(message, "*");
}

const queryString = new URLSearchParams(window.location.search);
const componentStatus = queryString.get("component_status");

const isIframe = window.self !== window.top;

if (isIframe) {
  // this is an iframe
  insecurePostMessage({
    type: "xendit-iframe-action-complete",
  });
} else {
  const hosts: Record<string, string> = {
    "production-live": "https://checkout-ui-gateway.xendit.co",
    "production-development": "https://checkout-ui-gateway-prod-dev.xendit.co",
    "staging-live": "https://checkout-ui-gateway-live.stg.tidnex.dev",
    "staging-development": "https://checkout-ui-gateway-dev.stg.tidnex.dev",
  };
  const env = queryString.get("env") ?? "production-live";
  const sessionAuthId = queryString.get("session_auth_id");
  const targetHost = hosts[env] ?? hosts["production-live"];
  const fallbackUrl =
    componentStatus === "SUCCESS"
      ? "https://xendit.co/success"
      : "https://xendit.co/failure";

  if (sessionAuthId) {
    const getSessionUrl = new URL(`/api/sessions/${sessionAuthId}`, targetHost);
    const componentsVersion = queryString.get("components_version") ?? "v0.0.0";
    getSessionUrl.searchParams.set("components_version", componentsVersion);
    fetch(getSessionUrl.toString())
      .then((response) => response.json())
      .then((data) => {
        const returnUrl = data?.session?.components_configuration?.return_url;
        if (returnUrl) {
          const url = new URL(returnUrl);
          if (componentStatus)
            url.searchParams.set("component_status", componentStatus);
          window.location.href = url.toString();
        } else {
          window.location.href = fallbackUrl;
        }
      })
      .catch(() => {
        window.location.href = fallbackUrl;
      });
  } else {
    window.location.href = fallbackUrl;
  }
}
