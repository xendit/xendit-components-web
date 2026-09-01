import { ChannelProperties } from "./public-sdk";
import { describe, expect, it } from "vitest";
import {
  channelPropertiesChanged,
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

describe("utils - channelPropertiesChanged", () => {
  it("is false for equal objects", () => {
    const a: ChannelProperties = { card_details: { first_name: "Budi" } };
    const b: ChannelProperties = { card_details: { first_name: "Budi" } };
    expect(channelPropertiesChanged(a, b)).toBe(false);
  });

  it("is true when a value changes", () => {
    const a: ChannelProperties = { card_details: { first_name: "Budi" } };
    const b: ChannelProperties = { card_details: { first_name: "Dewa" } };
    expect(channelPropertiesChanged(a, b)).toBe(true);
  });

  it("is true when a key is added", () => {
    const a: ChannelProperties = {};
    const b: ChannelProperties = { card_details: { first_name: "Budi" } };
    expect(channelPropertiesChanged(a, b)).toBe(true);
  });

  it("is true when a key is removed", () => {
    const a: ChannelProperties = {
      card_details: { first_name: "Budi" },
      billing_information: { city: "Jakarta" },
    };
    const b: ChannelProperties = { card_details: { first_name: "Budi" } };
    expect(channelPropertiesChanged(a, b)).toBe(true);
  });
});
