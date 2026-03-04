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
    const nothing = screen.queryByText("Installment plan");
    expect(nothing).not.toBeInTheDocument();

    await sleep(300);

    // now the installment plan should appear
    const installmentPlanLabel = screen.queryByText("Installment plan");
    expect(installmentPlanLabel).toBeInTheDocument();

    // by default, the first option should be selected
    const dropdown = screen.getByRole("button", {
      name: "3x Installments — Rp3.333",
    });
    expect(dropdown).toBeInTheDocument();

    // open the dropdown and choose 3 installments
    assert(dropdown);
    await userEvent.click(dropdown);
    const option6 = await screen.findByText("6x Installments — Rp1.666");
    expect(option6).toBeInTheDocument();
    await userEvent.click(option6);

    // the sdk internal channel properties should have the selected installment plan
    const channelProperties =
      sdk[internal].liveComponents.paymentChannels.get(
        "MOCK_INSTALLMENTS",
      )?.channelProperties;
    expect(channelProperties).toEqual({
      installment_configuration: {
        terms: 3,
        interval: "MONTH",
        code: "3M",
      },
    });
  });
});
