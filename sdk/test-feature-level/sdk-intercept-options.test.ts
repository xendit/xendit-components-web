import { afterEach, describe, expect, it, vi } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";

describe("sdk intercept options", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("interceptChannelConfig", () => {
    it("should allow filtering channels via interceptChannelConfig", async () => {
      const sdk = new XenditComponentsTest({
        interceptChannelConfig: ({ channels, channel_ui_groups }) => ({
          channels: channels.filter((ch) => ch.channel_code === "CARDS"),
          channel_ui_groups,
        }),
      });

      await waitForEvent(sdk, "init");

      const channels = sdk.getActiveChannels();
      expect(channels.length).toBe(1);
      expect(channels[0].channelCode).toBe("CARDS");
    });

    it("should allow modifying channel properties via interceptChannelConfig", async () => {
      const sdk = new XenditComponentsTest({
        interceptChannelConfig: ({ channels, channel_ui_groups }) => ({
          channels: channels.map((ch) => ({
            ...ch,
            brand_name: `Modified: ${ch.brand_name}`,
          })),
          channel_ui_groups,
        }),
      });

      await waitForEvent(sdk, "init");

      const channels = sdk.getActiveChannels();
      // All channels should have modified brand names
      channels.forEach((channel) => {
        expect(channel.brandName).toMatch(/^Modified: /);
      });
    });

    it("should not affect channels when interceptChannelConfig is undefined", async () => {
      const sdk = new XenditComponentsTest({});

      await waitForEvent(sdk, "init");

      const channels = sdk.getActiveChannels();
      // Should have default test channels
      expect(channels.length).toBeGreaterThan(0);
    });

    it("should receive channels after removeBlockedChannels is applied", async () => {
      let receivedChannels: unknown[] = [];
      const sdk = new XenditComponentsTest({
        interceptChannelConfig: ({ channels, channel_ui_groups }) => {
          receivedChannels = channels;
          return { channels, channel_ui_groups };
        },
      });

      await waitForEvent(sdk, "init");

      // The interceptor receives channels after removeBlockedChannels is applied
      expect(receivedChannels.length).toBeGreaterThan(0);
    });

    it("should allow modifying channel_ui_groups via interceptChannelConfig", async () => {
      const sdk = new XenditComponentsTest({
        interceptChannelConfig: ({ channels, channel_ui_groups }) => ({
          channels,
          channel_ui_groups: channel_ui_groups.map((g) => ({
            ...g,
            label: `Custom: ${g.label}`,
          })),
        }),
      });

      await waitForEvent(sdk, "init");

      const groups = sdk.getActiveChannelGroups();
      groups.forEach((group) => {
        expect(group.label).toMatch(/^Custom: /);
      });
    });
  });

  describe("interceptLocaleStrings", () => {
    it("should allow overriding locale strings via interceptLocaleStrings", async () => {
      const sdk = new XenditComponentsTest({
        interceptLocaleStrings: (strings) => ({
          ...strings,
          "validation.card_cvn_invalid": "Custom CVN error",
        }),
      });

      await waitForEvent(sdk, "init");

      // Access the t function through the internal property
      expect(sdk.t("validation.card_cvn_invalid")).toBe("Custom CVN error");
    });

    it("should preserve unmodified locale strings", async () => {
      const sdk = new XenditComponentsTest({
        interceptLocaleStrings: (strings) => ({
          ...strings,
          "validation.card_cvn_invalid": "Custom CVN error",
        }),
      });

      await waitForEvent(sdk, "init");

      // Other strings should remain unchanged
      expect(sdk.t("validation.required", { field: "Email" })).toBe(
        "Email is required.",
      );
    });

    it("should support interpolation with intercepted strings", async () => {
      const sdk = new XenditComponentsTest({
        interceptLocaleStrings: (strings) => ({
          ...strings,
          "validation.required": "{{field}} must be provided",
        }),
      });

      await waitForEvent(sdk, "init");

      expect(sdk.t("validation.required", { field: "Name" })).toBe(
        "Name must be provided",
      );
    });

    it("should use original locale strings when interceptLocaleStrings is undefined", async () => {
      const sdk = new XenditComponentsTest({});

      await waitForEvent(sdk, "init");

      expect(sdk.t("validation.card_cvn_invalid")).toBe("CVN is not valid");
    });

    it("should apply interceptor based on session locale", async () => {
      // Note: XenditComponentsTest uses test data with a default locale
      const sdk = new XenditComponentsTest({
        interceptLocaleStrings: (strings) => ({
          ...strings,
          "validation.card_cvn_invalid": "Intercepted for locale",
        }),
      });

      await waitForEvent(sdk, "init");

      expect(sdk.t("validation.card_cvn_invalid")).toBe(
        "Intercepted for locale",
      );
    });
  });

  describe("combined intercept options", () => {
    it("should support both interceptChannelConfig and interceptLocaleStrings together", async () => {
      const sdk = new XenditComponentsTest({
        interceptChannelConfig: ({ channels, channel_ui_groups }) => ({
          channels: channels.filter((ch) => ch.channel_code === "CARDS"),
          channel_ui_groups,
        }),
        interceptLocaleStrings: (strings) => ({
          ...strings,
          "validation.card_cvn_invalid": "Custom CVN message",
        }),
      });

      await waitForEvent(sdk, "init");

      // Channel config interception should work
      const channels = sdk.getActiveChannels();
      expect(channels.length).toBe(1);
      expect(channels[0].channelCode).toBe("CARDS");

      // Locale strings interception should work
      expect(sdk.t("validation.card_cvn_invalid")).toBe("Custom CVN message");
    });
  });
});
