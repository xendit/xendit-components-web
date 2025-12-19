import { XenditEventMap, XenditSessionSdk } from "../src";

export function watchEvents<T extends keyof XenditEventMap>(
  sdk: XenditSessionSdk,
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
  sdk: XenditSessionSdk,
  eventName: keyof XenditEventMap,
) {
  return new Promise<void>((resolve) => {
    sdk.addEventListener(
      eventName,
      () => {
        resolve();
      },
      { once: true },
    );
  });
}

export function findEvent(arr: ReturnType<typeof watchEvents>, name: string) {
  return arr.find((e) => e.name === name);
}
