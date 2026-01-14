import { ChannelProperties } from "./public-sdk";
import { makeTestBffData, makeTestSdkKey } from "./test-data";
import {
  assert,
  camelCaseToKebabCase,
  cancellableSleep,
  errorToString,
  getCardNunberFromChannelProperties,
  getValueFromChannelProperty,
  isAbortError,
  mergeIgnoringUndefined,
  parseSdkKey,
  resolvePairedChannel,
  satisfiesMinMax,
  SLEEP_MULTIPLIER,
} from "./utils";
import { describe, expect, it } from "vitest";

const D = 10000;

describe("utils - cancellableSleep", () => {
  it("should sleep if not aborted", async () => {
    const signal = new AbortController().signal;
    const start = Date.now();
    await cancellableSleep(D, signal);
    const duration = Date.now() - start;
    expect(duration).toBeGreaterThanOrEqual(D * SLEEP_MULTIPLIER);
  });
  it("should abort sleep if aborted", async () => {
    const controller = new AbortController();
    const signal = controller.signal;
    const sleepPromise = cancellableSleep(D, signal);
    controller.abort();
    try {
      await sleepPromise;
      throw new Error(`Expected sleep to be aborted, but it completed`);
    } catch (error) {
      if (isAbortError(error)) {
        // expected
      } else {
        throw error;
      }
    }
  });
  it("should handle being aborted before sleeping", async () => {
    const controller = new AbortController();
    const signal = controller.signal;
    controller.abort();
    const sleepPromise = cancellableSleep(D, signal);
    try {
      await sleepPromise;
      throw new Error(`Expected sleep to be aborted, but it completed`);
    } catch (error) {
      if (isAbortError(error)) {
        // expected
      } else {
        throw error;
      }
    }
  });
});

describe("utils - camelCaseToKebabCase", () => {
  it("should convert camelCase to kebab-case", () => {
    const cases: [string, string][] = [
      ["camelCase", "camel-case"],
      ["CamelCase", "camel-case"],
      ["thisIsATest", "this-is-a-test"],
    ];
    for (const [input, expected] of cases) {
      expect(camelCaseToKebabCase(input)).toBe(expected);
    }
  });
});

describe("utils - parseSdkKey", () => {
  it("should parse valid sdk keys", () => {
    const key = makeTestSdkKey();
    const parsed = parseSdkKey(key);
    expect(parsed).toEqual({
      sessionAuthKey: expect.any(String),
      hostId: "mock",
      publicKey: expect.any(String),
      signature: expect.any(String),
    });
  });
  it("should throw on invalid sdk keys", () => {
    const invalidKeys = [
      "",
      "wrong-number-of-parts-1-2-3-4",
      makeTestSdkKey().replace(/mock/g, "mock2"), // wrong hostid
    ];
    for (const key of invalidKeys) {
      expect(() => parseSdkKey(key)).toThrow();
    }
  });
});

describe("utils - mergeIgnoringUndefined", () => {
  it("should merge objects ignoring undefined values", () => {
    const obj1 = { a: 1, b: undefined, c: null };
    const res = mergeIgnoringUndefined({}, obj1);
    expect(res).toEqual({ a: 1, c: null });
  });
});

describe("utils - errorToString", () => {
  it("should convert errors to strings", () => {
    const e1 = new Error("Test error");
    expect(errorToString(e1)).toBe(e1.stack);
    const e2 = "Just a string";
    expect(errorToString(e2)).toBe(e2);
    const e3 = { message: "Error message" };
    expect(errorToString(e3)).toBe(`Unknown error: ${JSON.stringify(e3)}`);
    const e4 = { nonSerializable: 0n };
    expect(errorToString(e4)).toBe("Unknown error");
  });
});

describe("utils - getValueFromChannelProperty", () => {
  it("should get value from channel property", () => {
    const channelProperties: ChannelProperties = {
      simple: "1",
      nested: {
        nested: {
          nested: "2",
        },
      },
    };
    expect(getValueFromChannelProperty("simple", channelProperties)).toBe("1");
    expect(
      getValueFromChannelProperty("nested.nested.nested", channelProperties),
    ).toBe("2");
    expect(
      getValueFromChannelProperty("nonexistent", channelProperties),
    ).toBeUndefined();
    expect(
      getValueFromChannelProperty("nested.nonexistent", channelProperties),
    ).toBeUndefined();
  });
  it("should return undefined for null channel properties", () => {
    expect(getValueFromChannelProperty("any.key", null)).toBeUndefined();
  });
});

describe("utils - getCardNunberFromChannelProperties", () => {
  it("should get card number from channel properties", () => {
    const channelProperties: ChannelProperties = {
      card_details: {
        card_number: "encrypted-string",
      },
    };
    expect(getCardNunberFromChannelProperties(channelProperties)).toBe(
      "encrypted-string",
    );
  });
  it("should return null if card number not present", () => {
    const channelProperties: ChannelProperties = {};
    expect(getCardNunberFromChannelProperties(channelProperties)).toBeNull();
  });
});

describe("utils - resolvePairedChannel", () => {
  it("should resolve paired channels", () => {
    const nonpair = makeTestBffData().channels.find(
      (ch) => ch.channel_code === "MOCK_QR",
    );
    assert(nonpair);
    const pair1 = makeTestBffData().channels.find(
      (ch) => ch.channel_code === "UI_PAIRED_CHANNELS_TEST_1",
    )!;
    assert(pair1);
    const pair2 = makeTestBffData().channels.find(
      (ch) => ch.channel_code === "UI_PAIRED_CHANNELS_TEST_2",
    )!;
    assert(pair2);

    expect(resolvePairedChannel([nonpair], true)).toBe(nonpair);
    expect(resolvePairedChannel([nonpair], false)).toBe(nonpair);
    expect(resolvePairedChannel([pair1, pair2], true)).toBe(pair2);
    expect(resolvePairedChannel([pair1, pair2], false)).toBe(pair1);
  });
});

describe("utils - satisfiesMinMax", () => {
  it("should validate min and max values", () => {
    const channel = makeTestBffData().channels.find(
      (ch) => ch.channel_code === "MOCK_QR",
    );
    assert(channel);

    const saveSession = { amount: 0, session_type: "SAVE" } as const;
    expect(satisfiesMinMax(saveSession, channel)).toBe(true);

    const session1 = { amount: 5000, session_type: "PAY" } as const;
    expect(satisfiesMinMax(session1, channel)).toBe(true);

    const session2 = { amount: 50, session_type: "PAY" } as const;
    expect(satisfiesMinMax(session2, channel)).toBe(false);

    const session3 = { amount: 500000000, session_type: "PAY" } as const;
    expect(satisfiesMinMax(session3, channel)).toBe(false);
  });
});
