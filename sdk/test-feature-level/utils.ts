import { expect } from "vitest";
import { XenditEventMap, XenditComponents } from "../src";

/* v8 ignore start */

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

function waitForEventHelper(
  sdk: XenditComponents,
  eventName: keyof XenditEventMap,
  expectedKeys: Record<string, unknown> = {},
  callback: (err?: Error) => void,
) {
  const fn = (event: Event) => {
    clearTimeout(timeout);
    try {
      expect(event).toMatchObject(expectedKeys);
    } catch (e) {
      return callback(e as Error);
    }
    callback();
  };
  const timeout = setTimeout(() => {
    sdk.removeEventListener(eventName, fn);
    callback(new Error(`Expected event "${eventName}" but it did not fire`));
  }, 3000);
  sdk.addEventListener(eventName, fn, { once: true });
}

/**
 * Resolves when the specified event is fired.
 */
export function waitForEvent(
  sdk: XenditComponents,
  eventName: keyof XenditEventMap,
  expectedKeys: Record<string, unknown> = {},
) {
  return new Promise<void>((resolve, reject) => {
    waitForEventHelper(sdk, eventName, expectedKeys, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

function waitForEventSequenceHelper(
  sdk: XenditComponents,
  events: {
    name: keyof XenditEventMap;
    expectedKeys?: Record<string, unknown>;
  }[],
  callback: (err?: Error) => void,
) {
  waitForEventHelper(
    sdk,
    events[0].name,
    events[0].expectedKeys || {},
    (err) => {
      if (err) {
        return callback(err);
      }
      if (events.length === 1) {
        return callback();
      }
      waitForEventSequenceHelper(sdk, events.slice(1), callback);
    },
  );
}

/**
 * Resolves when the specified sequence of events are fired in order.
 */
export function waitForEventSequence(
  sdk: XenditComponents,
  events: {
    name: keyof XenditEventMap;
    expectedKeys?: Record<string, unknown>;
  }[],
) {
  return new Promise<void>((resolve, reject) => {
    waitForEventSequenceHelper(sdk, events, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

export function findEvent(arr: ReturnType<typeof watchEvents>, name: string) {
  return arr.find((e) => e.name === name);
}

export type Writable<T> = {
  -readonly [K in keyof T]: T[K];
};
