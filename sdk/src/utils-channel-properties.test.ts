import { ChannelComponentData, ChannelProperties } from "./public-sdk";
import { describe, expect, it } from "vitest";
import {
  channelPropertiesChanged,
  getCardDetailsForCurrentCardNumber,
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

describe("utils - getCardDetailsForCurrentCardNumber", () => {
  const details = {
    schemes: ["VISA"],
    country_codes: ["ID"],
    require_billing_information: false,
  };

  function channelDataForCardNumber(cardNumber: string): ChannelComponentData {
    return {
      isOneclick: false,
      savePaymentMethod: false,
      cardBin: null,
      cardDetails: { cardNumber, details },
      paymentOptions: null,
      customerDetails: null,
    };
  }

  function propsWithCardNumber(cardNumber: string): ChannelProperties {
    return { card_details: { card_number: cardNumber } };
  }

  it("should return the details when they belong to the current card number", () => {
    expect(
      getCardDetailsForCurrentCardNumber(
        propsWithCardNumber("CARD-A"),
        channelDataForCardNumber("CARD-A"),
      ),
    ).toBe(details);
  });

  it("should return null when the details belong to a different card number", () => {
    // the user already changed the card number, but the lookup for the new number has not come back yet
    expect(
      getCardDetailsForCurrentCardNumber(
        propsWithCardNumber("CARD-B"),
        channelDataForCardNumber("CARD-A"),
      ),
    ).toBeNull();
  });

  it("should return null when no lookup has completed yet", () => {
    expect(
      getCardDetailsForCurrentCardNumber(propsWithCardNumber("CARD-A"), null),
    ).toBeNull();
    expect(
      getCardDetailsForCurrentCardNumber(propsWithCardNumber("CARD-A"), {
        isOneclick: false,
        savePaymentMethod: false,
        cardBin: null,
        cardDetails: null,
        paymentOptions: null,
        customerDetails: null,
      }),
    ).toBeNull();
  });

  it("should return null when the form has no card number", () => {
    expect(
      getCardDetailsForCurrentCardNumber(
        {},
        channelDataForCardNumber("CARD-A"),
      ),
    ).toBeNull();
    expect(
      getCardDetailsForCurrentCardNumber(
        null,
        channelDataForCardNumber("CARD-A"),
      ),
    ).toBeNull();
  });
});
