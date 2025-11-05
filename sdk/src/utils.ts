import { useLayoutEffect, useRef } from "preact/hooks";
import { BffAction } from "./backend-types/payment-entity";

export function assert<T>(arg: unknown): asserts arg is NonNullable<T> {
  if (arg === null || arg === undefined) {
    throw new Error(
      "Assertion failed: argument is null or undefined; this is a bug, please contact support.",
    );
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A sleep function that can be cancelled via an AbortSignal.
 */
export function cancellableSleep(
  ms: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      resolve();
    }, ms);

    // already aborted
    if (signal.aborted) {
      clearTimeout(timeoutId);
      reject(new Error("Aborted"));
      return;
    }

    // abort on signal
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeoutId);
        reject(new Error("Aborted"));
      },
      { once: true },
    );
  });
}

export function camelCaseToKebabCase(str: string): string {
  return str.replace(/[A-Z]/gm, (match, offset) => {
    if (offset === 0) return match.toLowerCase();
    return `-${match.toLowerCase()}`;
  });
}

/**
 * Creates an async iterator with exponential delay. Yields the attempt number.
 *
 * Use with async for (const attempt of retryLoop(100, 5)).
 *
 * Delay is mult * base ** attempt
 * e.g. mult = 100ms, tries = 5, base = 2:
 * 100ms, 200ms, 400ms, 800ms, 1600ms
 *
 * Doesn't wait in tests, unless waitInTests=true.
 */
export async function* retryLoop(mult: number, tries: number, base = 2) {
  // first attempt always instant
  yield 0;

  let sleepTime = mult;

  for (let i = 1; i < tries; i++) {
    sleepTime *= base;
    await sleep(sleepTime);
    yield i;
  }
}

export function redirectCanBeHandledInIframe(action: BffAction): boolean {
  return true;
}

export function pickAction(actions: BffAction[]): BffAction {
  return actions[0];
}

export type ParsedSdkKey = {
  sessionAuthKey: string;
  publicKey: string;
  signature: string;
};

export function parseSdkKey(componentsSdkKey: string): ParsedSdkKey {
  if (!componentsSdkKey) {
    throw new Error(
      "The componentsSdkKey option is missing; check the constructor parameters.",
    );
  }
  const parts = componentsSdkKey.split("-");
  if (parts.length < 4) {
    throw new Error(
      "The componentsSdkKey option has the wrong format. Ensure you pass the value returned from the `components_sdk_key` property of the `POST /sessions` response.",
    );
  }
  return {
    sessionAuthKey: [parts[0], parts[1]].join("-"),
    publicKey: parts[2],
    signature: parts[3],
  };
}

export function areArraysShallowEqual(a: unknown[], b: unknown[]) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
/**
 * Return a copy of original, with properties from updates applied on top, except undefined properties.
 */
export function mergeIgnoringUndefined<T>(
  original: T,
  updates: Partial<{ [K in keyof T]: T[K] | undefined }>,
): T {
  const result = { ...original };
  for (const key of Object.keys(updates) as (keyof T)[]) {
    const value = updates[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export function usePrevious<T>(value: T) {
  const ref = useRef<T>(); // Create a ref to store the previous value

  useLayoutEffect(() => {
    ref.current = value; // Update the ref's current value after each render
  });

  // eslint-disable-next-line react-hooks/refs
  return ref.current; // Return the value stored in the ref (which is the previous value)
}
