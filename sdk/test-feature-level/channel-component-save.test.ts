import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { assert } from "../src/utils";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { internal } from "../src/internal";

afterEach(() => {
  document.body.replaceChildren();
});

describe("channel component save", () => {
  it("should render channel component with save checkbox", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({
      filter: "UI_SAVE_PAYMENT_DETAILS_TEST",
    })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // save checkbox should exist
    const checkbox = screen.getByLabelText("Save for faster payment next time");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeInstanceOf(HTMLInputElement);

    // it should be interactive
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("should persist value of save checkbox in internal channel data", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({
      filter: "UI_SAVE_PAYMENT_DETAILS_TEST",
    })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    function getRealValueOfSaveCheckbox() {
      return sdk[internal].liveComponents.paymentChannels.get(
        "UI_SAVE_PAYMENT_DETAILS_TEST",
      )?.data.savePaymentMethod;
    }
    expect(getRealValueOfSaveCheckbox()).toBe(false);

    const checkbox = screen.getByLabelText("Save for faster payment next time");
    await userEvent.click(checkbox);

    expect(getRealValueOfSaveCheckbox()).toBe(true);
  });
});
