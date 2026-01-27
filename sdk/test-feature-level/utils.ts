import { XenditEventMap, XenditComponents } from "../src";

export function watchEvents<T extends keyof XenditEventMap>(
  sdk: XenditComponents,
  eventNames: T[],
) {
  const events: Array<{
    name: T;
    event: XenditEventMap[T];
  }> = [];
  eventNames.forEach((eventName) => {
    sdk.addEventListener(eventName, (event) => {
      events.push({ name: eventName, event: event });
    });
  });
  return events;
}

export function waitForEvent(
  sdk: XenditComponents,
  eventName: keyof XenditEventMap,
) {
  return new Promise<void>((resolve, reject) => {
    const fn = () => {
      clearTimeout(timeout);
      resolve();
    };
    const timeout = setTimeout(() => {
      sdk.removeEventListener(eventName, fn);
      reject(new Error(`Expected event "${eventName}" but it did not fire`));
    }, 3000);
    sdk.addEventListener(eventName, fn, { once: true });
  });
}

export function findEvent(arr: ReturnType<typeof watchEvents>, name: string) {
  return arr.find((e) => e.name === name);
}

export type Writable<T> = {
  -readonly [K in keyof T]: T[K];
};
