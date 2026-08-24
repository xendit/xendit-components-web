import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { assert, sleep } from "../src/utils";
import { internal } from "../src/internal";
import { screen } from "@testing-library/dom";

afterEach(() => {
  document.body.replaceChildren();
});

describe("channel component country field test", () => {
  describe("browser autofill via the hidden native select", () => {
    // simulates the browser autofill, writing a value directly onto the native `<select>` and firing its change event
    function autofillNativeSelect(select: HTMLSelectElement, value: string) {
      select.value = value;
      select.dispatchEvent(new Event("change"));
    }

    it("clears the country when the browser clears the select", async () => {
      const sdk = new XenditComponentsTest({
        componentsSdkKey: "test-client-key",
      });

      await waitForEvent(sdk, "init");

      const ch = sdk.getActiveChannels({ filter: "UI_STATE_PROVINCE_TEST" })[0];
      assert(ch);
      document.body.appendChild(sdk.createChannelComponent(ch));

      // sleeping here isn't ideal but the province field relies on the country field's onChange to populate its options and that rerender is async even though it shouldn't be
      await sleep(1);

      const select = document.querySelector(
        'select[name="country_field"]',
      ) as HTMLSelectElement;
      expect(select.value).toBe("US");

      autofillNativeSelect(select, "");
      await sleep(1); // wait for the dropdown UI to re-render with the new value

      const channelProperties = sdk[
        internal
      ].liveComponents.paymentChannels.get(
        "UI_STATE_PROVINCE_TEST",
      )?.channelProperties;
      expect(channelProperties).toMatchObject({ country_field: "" });
      expect(screen.getAllByRole("button")[0].textContent).toBe("Country");
    });

    it("updates the country when the browser fills a country we offer", async () => {
      const sdk = new XenditComponentsTest({
        componentsSdkKey: "test-client-key",
      });

      await waitForEvent(sdk, "init");

      const ch = sdk.getActiveChannels({ filter: "UI_STATE_PROVINCE_TEST" })[0];
      assert(ch);
      document.body.appendChild(sdk.createChannelComponent(ch));

      // sleeping here isn't ideal but the province field relies on the country field's onChange to populate its options and that rerender is async even though it shouldn't be
      await sleep(1);

      const select = document.querySelector(
        'select[name="country_field"]',
      ) as HTMLSelectElement;

      autofillNativeSelect(select, "ID");
      await sleep(1); // wait for the dropdown UI to re-render with the new value

      const channelProperties = sdk[
        internal
      ].liveComponents.paymentChannels.get(
        "UI_STATE_PROVINCE_TEST",
      )?.channelProperties;
      expect(channelProperties).toMatchObject({ country_field: "ID" });
      expect(screen.getAllByRole("button")[0].textContent).toBe("Indonesia");
    });

    it("keeps the previous country when the browser fills a value we don't offer", async () => {
      const sdk = new XenditComponentsTest({
        componentsSdkKey: "test-client-key",
      });

      await waitForEvent(sdk, "init");

      const ch = sdk.getActiveChannels({ filter: "UI_STATE_PROVINCE_TEST" })[0];
      assert(ch);
      document.body.appendChild(sdk.createChannelComponent(ch));

      // sleeping here isn't ideal but the province field relies on the country field's onChange to populate its options and that rerender is async even though it shouldn't be
      await sleep(1);

      const select = document.querySelector(
        'select[name="country_field"]',
      ) as HTMLSelectElement;

      // a country the autofill might write that isn't in our list
      const unknownOption = document.createElement("option");
      unknownOption.value = "ZZ";
      select.appendChild(unknownOption);

      autofillNativeSelect(select, "ZZ");

      // UI and hidden select both fall back to the value we already had
      const channelProperties = sdk[
        internal
      ].liveComponents.paymentChannels.get(
        "UI_STATE_PROVINCE_TEST",
      )?.channelProperties;
      expect(channelProperties).toMatchObject({ country_field: "US" });
      expect(screen.getAllByRole("button")[0].textContent).toBe(
        "United States",
      );
      expect(select.value).toBe("US");
    });
  });
});
