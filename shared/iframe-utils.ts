import { IframeEvent } from "./types";

export function securePostMessage<T extends IframeEvent>(
  message: T,
  embedderOrigin: string,
) {
  window.parent.postMessage(message, embedderOrigin);
}

export function insecurePostMessage<T extends IframeEvent>(message: T) {
  window.parent.postMessage(message, "*");
}
