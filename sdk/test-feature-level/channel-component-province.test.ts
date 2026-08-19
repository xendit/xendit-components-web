import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { assert, sleep } from "../src/utils";
import { internal } from "../src/internal";
import { screen } from "@testing-library/dom";

afterEach(() => {
  document.body.replaceChildren();
});

function dropdownItem(label: string) {
  return screen.getByText(label, {
    selector: ".xendit-dropdown-item-title",
  });
}

describe("channel component state/province field test", () => {
  it("should render state/province field with initial values", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "UI_STATE_PROVINCE_TEST" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // sleeping here isn't ideal but the province field relies on the country field's onChange to populate its options and that rerender is async even though it shouldn't be
    await sleep(1);

    const channelProperties = sdk[internal].liveComponents.paymentChannels.get(
      "UI_STATE_PROVINCE_TEST",
    )?.channelProperties;

    // they should all be populated
    expect(channelProperties).toEqual({
      country_field: "US",
      province_field: "CA",
      country_field_2: "AU",
      province_field_2: "NSW",
    });

    // all the inputs should be blank
    const buttons = screen.getAllByRole("button");
    const country1 = buttons[0];
    const province1 = buttons[1];
    const country2 = buttons[2];
    const province2 = screen.getByPlaceholderText("State / Province");

    expect(country1.textContent).toBe("United States");
    expect(province1.textContent).toBe("California");
    expect(country2.textContent).toBe("Australia");
    expect(province2).toHaveValue("NSW");
  });

  it("should clear province when country changes", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "UI_STATE_PROVINCE_TEST" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // sleeping here isn't ideal but the province field relies on the country field's onChange to populate its options and that rerender is async even though it shouldn't be
    await sleep(1);

    // test that changing from dropdown to text input clears the value
    const buttons = screen.getAllByRole("button");
    const country1 = buttons[0];

    await country1.click();
    await dropdownItem("Singapore").click();

    expect(screen.getAllByPlaceholderText("State / Province")).toHaveLength(2);
    const province1 = screen.getAllByPlaceholderText("State / Province")[0];
    expect(province1).toHaveValue("");

    // test changing text input to dropdown also clears the value
    const country2 = buttons[2];
    await country2.click();
    await dropdownItem("Canada").click();
    const province2 = screen.getAllByRole("button")[2]; // second province field should have switched to a dropdown
    expect(province2.textContent).toBe("State / Province");

    // test we can change the province
    await province2.click();
    await dropdownItem("Ontario").click();
    expect(screen.getAllByRole("button")[2].textContent).toBe("Ontario");
  });
});
