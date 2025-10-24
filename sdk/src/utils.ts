import { ChannelProperties } from "./backend-types/channel";
import { BffAction } from "./backend-types/payment-entity";

export function assert<T>(arg: unknown): asserts arg is NonNullable<T> {
  if (arg === null || arg === undefined) {
    throw new Error("Assertion failed: argument is null or undefined");
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  if (process.env.NODE_ENV === "test") {
    sleepTime = 0;
  }

  for (let i = 1; i < tries; i++) {
    sleepTime *= base;
    await sleep(sleepTime);
    yield i;
  }
}

export function redirectCanBeHandledInIframe(
  channelProperties: ChannelProperties,
  action: BffAction,
): boolean {
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
    throw new Error("componentsSdkKey is missing");
  }
  const parts = componentsSdkKey.split("-");
  if (parts.length < 4) {
    throw new Error("Invalid componentsSdkKey format");
  }
  return {
    sessionAuthKey: [parts[0], parts[1]].join("-"),
    publicKey: parts[2],
    signature: parts[3],
  };
}

export function isRedirectIframeCapable(action: BffAction): boolean {
  // TODO
  return true;
}
