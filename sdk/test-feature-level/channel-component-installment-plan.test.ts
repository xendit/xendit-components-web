import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { assert, sleep } from "../src/utils";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { internal } from "../src/internal";

afterEach(() => {
  document.body.replaceChildren();
});

describe("channel component installment plan", () => {
  it("should show channel with installment plan component", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "MOCK_INSTALLMENTS" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // the installment plan field should be disabled
    const label = screen.queryByText("Installment plan") as HTMLLabelElement;
    expect(label).toBeInTheDocument();
    const disabledButton = document.getElementById(label.htmlFor);
    expect(disabledButton).toBeDisabled();
    expect(disabledButton).toHaveTextContent("");

    await sleep(300);

    // by default, the first option should be selected
    const dropdown = screen.getByRole("button", {
      name: "Installment plan",
    });
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveTextContent("3x Installments — Rp3.333");

    // the channel properties should match
    expect(getSdkChannelProperties(sdk, "MOCK_INSTALLMENTS")).toEqual({
      installment_configuration: {
        terms: 3,
        interval: "MONTH",
        code: "3M",
      },
    });

    // open the dropdown and choose the 6x option
    assert(dropdown);
    await userEvent.click(dropdown);
    const option6 = await screen.findByText("6x Installments — Rp1.666");
    expect(option6).toBeInTheDocument();
    await userEvent.click(option6);

    // the sdk internal channel properties should have the selected installment plan
    expect(getSdkChannelProperties(sdk, "MOCK_INSTALLMENTS")).toEqual({
      installment_configuration: {
        terms: 6,
        interval: "MONTH",
        code: "6M",
      },
    });
  });
});

function getSdkChannelProperties(
  sdk: XenditComponentsTest,
  channelCode: string,
) {
  return sdk[internal].liveComponents.paymentChannels.get(channelCode)
    ?.channelProperties;
}
