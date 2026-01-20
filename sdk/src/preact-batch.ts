import { options } from "preact";

let once = false;

export function setupPreactBatch() {
  if (once) {
    return;
  }
  once = true;
  options.debounceRendering = (fn) => queueMicrotask(fn);
}
