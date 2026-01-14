import {
  BffChannel,
  ChannelFormField,
  ChannelProperties,
  ChannelProperty,
} from "./backend-types/channel";
import { useLayoutEffect, useRef } from "preact/hooks";
import { BffAction } from "./backend-types/payment-entity";
import { BffSession } from "./backend-types/session";
import { internal } from "./internal";

export const MOCK_NETWORK_DELAY_MS = 300;

export function assert<T>(arg: unknown): asserts arg is NonNullable<T> {
  if (arg === null || arg === undefined) {
    throw new Error(
      "Assertion failed: argument is null or undefined; this is a bug, please contact support.",
    );
  }
}

export function assertEquals<T>(a: unknown, b: T): asserts a is T {
  if (a !== b) {
    throw new Error(`Assertion failed; this is a bug, please contact support.`);
  }
}

export function assertNotEquals<const A, const B extends A>(
  a: A,
  b: B,
): asserts a is Exclude<A, B> {
  if (a === b) {
    throw new Error(`Assertion failed; this is a bug, please contact support.`);
  }
}

const SLEEP_MULTIPLIER = process.env.NODE_ENV === "test" ? 0.01 : 1;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms * SLEEP_MULTIPLIER));
}

export class AbortError extends Error {
  constructor() {
    super("AbortError");
    this.name = "AbortError";
  }
}

export function isAbortError(error: unknown): error is AbortError {
  return error instanceof AbortError && error.name === "AbortError";
}

/**
 * A sleep function that can be cancelled via an AbortSignal.
 */
export function cancellableSleep(
  ms: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    function onAbort() {
      signal.removeEventListener("abort", onAbort);
      clearTimeout(timeoutId);
      reject(new AbortError());
    }

    const timeoutId = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms * SLEEP_MULTIPLIER);

    // already aborted
    if (signal.aborted) {
      onAbort();
      return;
    }

    // abort on signal
    signal.addEventListener("abort", onAbort);
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

export const MOCK_HOST_ID = "mock";

const hosts: Record<string, string | undefined> = {
  pl: process.env.XENDIT_CHECKOUT_UI_GATEWAY_PROD_LIVE,
  pd: process.env.XENDIT_CHECKOUT_UI_GATEWAY_PROD_DEV,
  sl: process.env.XENDIT_CHECKOUT_UI_GATEWAY_STAGING_LIVE,
  sd: process.env.XENDIT_CHECKOUT_UI_GATEWAY_STAGING_DEV,
};

export function hostFromHostId(hostId: string): string | null {
  return hosts[hostId] ?? null;
}

export type ParsedSdkKey = {
  sessionAuthKey: string;
  hostId: string;
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
  if (
    parts.length < 4 ||
    (parts[2] !== MOCK_HOST_ID && hostFromHostId(parts[2]) === null)
  ) {
    throw new Error(
      "The componentsSdkKey option has the wrong format. Ensure you pass the value returned from the `components_sdk_key` property of the `POST /sessions` response.",
    );
  }

  return {
    sessionAuthKey: [parts[0], parts[1]].join("-"),
    hostId: parts[2],
    publicKey: parts[3],
    signature: parts[4],
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

/**
 * Get the form field name for a given channel form field.
 * @param field The channel form field to get the name for.
 * @returns The form field name.
 */
export function formFieldName(field: ChannelFormField): string {
  let id: string;
  if (typeof field.channel_property === "string") {
    id = field.channel_property;
  } else {
    const keys = Object.values(field.channel_property);
    id = keys.join("__");
  }
  return id;
}

export function canBeSimulated(channel: BffChannel): boolean {
  switch (channel.pm_type) {
    case "QR_CODE":
    case "VIRTUAL_ACCOUNT":
    case "OVER_THE_COUNTER":
      return true;
    default:
      return false;
  }
}

export function errorToString(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return `Unknown error: ${JSON.stringify(error)}`;
  } catch {
    return "Unknown error";
  }
}

/**
 * Modifies the input object, deleting properties with undefined values, excluding symbol properties or getters.
 */
export function removeUndefinedPropertiesFromObject<T extends object>(
  object: T,
): T {
  for (const key of Object.keys(object) as (keyof T)[]) {
    if (typeof key === "symbol") {
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    if (descriptor === undefined) {
      continue;
    }
    if (typeof descriptor.get === "function") {
      continue;
    }
    if (descriptor.value === undefined) {
      delete object[key];
    }
  }
  return object;
}

export function getValueFromChannelProperty(
  channelProperty: string | string[],
  channelProperties: ChannelProperties | null,
) {
  let str = channelProperty;
  if (!channelProperties) {
    return undefined;
  }
  if (Array.isArray(str)) {
    throw new Error(
      "Getting values from channel property arrays is not supported.",
    );
  }

  let cursor: ChannelProperties | ChannelProperty = channelProperties;
  while (true) {
    if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) {
      return undefined;
    }
    const dotIndex = str.indexOf(".");
    if (dotIndex === -1) {
      return cursor ? cursor[str] : undefined;
    } else {
      const key = str.slice(0, dotIndex);
      cursor = cursor ? cursor[key] : undefined;
      str = str.slice(dotIndex + 1);
    }
  }
}

export function getCardNunberFromChannelProperties(
  channelProperties: ChannelProperties | null,
) {
  const cardNumber = getValueFromChannelProperty(
    "card_details.card_number",
    channelProperties,
  );
  if (typeof cardNumber !== "string") {
    return null;
  }
  return cardNumber;
}

const objectIdMap = new WeakMap<object, number>();
let objectIdCounter = 1;
export function objectId(object: object): string {
  if (!objectIdMap.has(object)) {
    objectIdMap.set(object, objectIdCounter++);
  }
  return objectIdMap.get(object)!.toString();
}

/**
 * useId but doesn't sometimes return the same id in different components
 */
export function useIdSafe(): string {
  const id = useRef(Math.random().toString(36).substring(2, 10));
  return `xendit-id-${id.current}`;
}

export function resolvePairedChannel(
  channels: BffChannel[],
  savePaymentMethod: boolean,
): BffChannel {
  assert(channels.length > 0);
  assert(channels.length <= 2);

  if (channels.length === 2) {
    if (savePaymentMethod) {
      assert(channels[1].allow_save === true);
      return channels[1];
    } else {
      assert(channels[0].allow_save === false);
      return channels[0];
    }
  } else {
    return channels[0];
  }
}

export function satisfiesMinMax(
  session: Pick<BffSession, "amount" | "session_type">,
  channel: BffChannel,
): boolean {
  if (session.session_type !== "PAY") {
    return true; // only pay sessions have min/max
  }

  const amount = session.amount;
  const min = channel.min_amount ?? 0;
  const max = channel.max_amount ?? Number.MAX_VALUE;
  if (amount < min || amount > max) {
    return false;
  }

  return true;
}

export function lockDownInteralProperty(obj: { [internal]: unknown }) {
  // make [internal] non-enumerable
  Object.defineProperty(obj, internal, {
    enumerable: false,
    writable: false,
    configurable: false,
    value: obj[internal],
  });
}
