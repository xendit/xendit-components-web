import { ChannelProperties } from "./public-sdk";
import { describe, expect, it } from "vitest";
import {
  getCardNumberFromChannelProperties,
  getValueFromChannelProperty,
} from "./utils-channel-properties";

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
    expect(getCardNumberFromChannelProperties(channelProperties)).toBe(
      "encrypted-string",
    );
  });
  it("should return null if card number not present", () => {
    const channelProperties: ChannelProperties = {};
    expect(getCardNumberFromChannelProperties(channelProperties)).toBeNull();
  });
});
