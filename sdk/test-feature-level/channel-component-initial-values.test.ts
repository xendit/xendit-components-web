import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { assert } from "../src/utils";
import { internal } from "../src/internal";
import { screen } from "@testing-library/dom";

afterEach(() => {
  document.body.replaceChildren();
});

// !!! Channel form initialization must be synchronous, there must be no awaits in these tests

describe("channel component initial values", () => {
  it("should render without initial values", async () => {
    const sdk = new XenditComponentsTest({});

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "UI_INPUT_TEST" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // do not sleep here, this should be synchronous

    const channelProperties =
      sdk[internal].liveComponents.paymentChannels.get(
        "UI_INPUT_TEST",
      )?.channelProperties;

    // they should all be blank
    expect(channelProperties).toEqual({
      card_number: "",
      country_field: "",
      cvn: "",
      dropdown_field: "",
      dropdown_field_with_icons: "",
      email_field: "",
      expiry_month: "",
      expiry_year: "",
      phone_number_field: "",
      postal_code_field: "",
      text_field: "",
    });

    // all the inputs should be blank
    expect(screen.getByLabelText("Text")).toHaveValue("");
    expect(screen.getByLabelText("Phone Number")).toHaveValue("");
    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(screen.getByLabelText("Postal Code")).toHaveValue("");
    expect(screen.getByLabelText("Country").textContent).toBe("Select");
    expect(screen.getByLabelText("Dropdown").textContent).toBe("Select");
    expect(screen.getByLabelText("Dropdown With Icons").textContent).toBe(
      "Select",
    );
  });

  it("should render with initial values", async () => {
    const sdk = new XenditComponentsTest({});

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "UI_INITIAL_VALUE_TEST" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // do not sleep here

    const channelProperties = sdk[internal].liveComponents.paymentChannels.get(
      "UI_INITIAL_VALUE_TEST",
    )?.channelProperties;

    // the channel properties should be populated with the initial values
    expect(channelProperties).toEqual({
      country_field: "SG",
      dropdown_field: "option_2",
      email_field: "initial_value@test.com",
      phone_number_field: "+6581234567",
      postal_code_field: "123456",
      text_field: "Initial value",
    });

    // all the inputs should be populated
    expect(screen.getByLabelText("Text")).toHaveValue("Initial value");
    expect(screen.getByLabelText("Phone Number")).toHaveValue("8123 4567");
    expect(screen.getByLabelText("Email")).toHaveValue(
      "initial_value@test.com",
    );
    expect(screen.getByLabelText("Postal Code")).toHaveValue("123456");
    expect(screen.getByLabelText("Country").textContent).toBe("Singapore");
    expect(screen.getByLabelText("Dropdown").textContent).toBe("Option 2");
  });
});
