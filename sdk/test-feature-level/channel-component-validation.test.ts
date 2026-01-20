import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { assert } from "../src/utils";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/dom";

afterEach(() => {
  document.body.replaceChildren();
});

describe("channel component validation", () => {
  it("should show validation errors only after blurring a field", async () => {
    const sdk = new XenditComponentsTest({
      sessionClientKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk
      .getActiveChannels()
      .find((c) => c.channelCode === "UI_TEXT_VALIDATION_TEST");
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    await userEvent.type(
      screen.getByLabelText("Validate Minimum Length (5)"),
      "1",
    );

    expect(
      screen.queryByText("Input must be at least 5 characters long"),
    ).not.toBeInTheDocument();

    assert(document.activeElement);
    (document.activeElement as HTMLElement).blur();

    // not happy about this, showing validation errors should by synchronous
    await Promise.resolve();

    expect(
      screen.queryByText("Validate Minimum Length (5) is too short"),
    ).toBeInTheDocument();
  });

  it("should not show validation errors (field is required) on blur if the field is empty", async () => {
    const sdk = new XenditComponentsTest({
      sessionClientKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk
      .getActiveChannels()
      .find((c) => c.channelCode === "UI_TEXT_VALIDATION_TEST");
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // focus and blur the required field without entering any value
    screen.getByLabelText("Validate Minimum Length (5)").focus();
    await Promise.resolve();
    assert(document.activeElement);
    (document.activeElement as HTMLElement).blur();
    await Promise.resolve();

    expect(
      screen.queryByText("Required Text Field is required"),
    ).not.toBeInTheDocument();
  });

  it("should show validation errors (field is required) when calling showValidationErrors", async () => {
    const sdk = new XenditComponentsTest({
      sessionClientKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk
      .getActiveChannels()
      .find((c) => c.channelCode === "UI_TEXT_VALIDATION_TEST");
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    expect(
      screen.queryByText("Required Text Field is required"),
    ).not.toBeInTheDocument();

    // explicitly show validation errors
    sdk.showValidationErrors();
    await Promise.resolve();

    expect(
      screen.queryByText("Required Text Field is required"),
    ).toBeInTheDocument();
  });
});
