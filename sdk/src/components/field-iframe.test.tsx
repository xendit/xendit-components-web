import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "preact";
import { XenditSessionProvider } from "./session-provider";
import { XenditComponentsTest } from "../public-sdk";
import { IframeField } from "./field-iframe";
import { ChannelFormField } from "../backend-types/channel";
import { waitForEvent, Writable } from "../../test-feature-level/utils";
import { internal } from "../internal";
import {
  IframeChangeEvent,
  IframeEvent,
  IframeReadyEvent,
} from "../../../shared/types";
import { assert, sleep } from "../utils";
import { InternalSetFieldTouchedEvent } from "../private-event-types";

afterEach(() => {
  render(null, document.body);
});

const field: ChannelFormField = {
  channel_property: "encrypted_field",
  type: {
    name: "credit_card_number",
  },
  label: "Select item",
  placeholder: "Please select",
  required: true,
  span: 2,
};

const iframeFieldAppearance = {
  inputStyles: {
    color: "red",
  },
};

describe("field-iframe", () => {
  it("should render an iframe", async () => {
    const sdk: XenditComponentsTest = new XenditComponentsTest({
      iframeFieldAppearance,
    });
    await waitForEvent(sdk, "init");
    sdk.assertInitialized();

    const onChange = vi.fn();
    render(
      <XenditSessionProvider sdk={sdk} data={sdk[internal].worldState}>
        <IframeField field={field} onChange={onChange} />
      </XenditSessionProvider>,
      document.body,
    );

    // assert iframe is rendered
    expect(document.querySelector("iframe")).not.toBeNull();
  });

  it("should pass focus to iframe", async () => {
    const sdk: XenditComponentsTest = new XenditComponentsTest({
      iframeFieldAppearance,
    });
    await waitForEvent(sdk, "init");
    sdk.assertInitialized();

    const onChange = vi.fn();
    render(
      <XenditSessionProvider sdk={sdk} data={sdk[internal].worldState}>
        <IframeField field={field} onChange={onChange} />
      </XenditSessionProvider>,
      document.body,
    );

    // attach message listener to iframe inner window
    const iframeElement = document.querySelector<HTMLIFrameElement>("iframe");
    assert(iframeElement?.contentWindow);
    const onMessage = vi.fn();
    iframeElement.contentWindow.addEventListener("message", onMessage);

    // focus the focus trap
    const focusTrap = document.querySelector<HTMLElement>(
      "xendit-form-associated-focus-trap",
    );
    assert(focusTrap);
    focusTrap.focus();

    // jsdom dispatches this event after a timeout
    await sleep(100);

    // it should send a message to iframe to focus
    expect(onMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "xendit-iframe-focus",
        }),
      }),
    );
  });

  it("should handle change event", async () => {
    const sdk: XenditComponentsTest = new XenditComponentsTest({});
    await waitForEvent(sdk, "init");
    sdk.assertInitialized();

    const onChange = vi.fn();
    render(
      <XenditSessionProvider sdk={sdk} data={sdk[internal].worldState}>
        <IframeField field={field} onChange={onChange} />
      </XenditSessionProvider>,
      document.body,
    );

    const iframeElement = document.querySelector<HTMLIFrameElement>("iframe");
    assert(iframeElement);

    // populate the public key
    fireIframeEvent(iframeElement, iframeReadyEvent());
    await sleep(1); // wait for rerender

    // simulate an update event
    fireIframeEvent(iframeElement, iframeChangeEvent({}));
    expect(onChange).toHaveBeenCalled();

    // hidden input should be populated
    const hiddenInput = document.querySelector<HTMLInputElement>(
      'input[type="hidden"]',
    );
    assert(hiddenInput);
    expect(hiddenInput.value).toBe(
      "xendit-encrypted-1-PUBLICKEY-IV-CIPHERTEXT",
    );
  });

  it("should handle change event (empty text)", async () => {
    const sdk: XenditComponentsTest = new XenditComponentsTest({});
    await waitForEvent(sdk, "init");
    sdk.assertInitialized();

    const onChange = vi.fn();
    render(
      <XenditSessionProvider sdk={sdk} data={sdk[internal].worldState}>
        <IframeField field={field} onChange={onChange} />
      </XenditSessionProvider>,
      document.body,
    );

    const iframeElement = document.querySelector<HTMLIFrameElement>("iframe");
    assert(iframeElement);

    // populate the public key
    fireIframeEvent(iframeElement, iframeReadyEvent());
    await sleep(1); // wait for rerender

    // simulate an update event
    fireIframeEvent(iframeElement, iframeChangeEvent({ empty: true }));
    expect(onChange).toHaveBeenCalled();

    // hidden input should be populated
    const hiddenInput = document.querySelector<HTMLInputElement>(
      'input[type="hidden"]',
    );
    assert(hiddenInput);
    expect(hiddenInput.value).toBe("");
  });

  it("should handle change event (invalid input)", async () => {
    const sdk: XenditComponentsTest = new XenditComponentsTest({});
    await waitForEvent(sdk, "init");
    sdk.assertInitialized();

    const onChange = vi.fn();
    render(
      <XenditSessionProvider sdk={sdk} data={sdk[internal].worldState}>
        <IframeField field={field} onChange={onChange} />
      </XenditSessionProvider>,
      document.body,
    );

    const iframeElement = document.querySelector<HTMLIFrameElement>("iframe");
    assert(iframeElement);

    // populate the public key
    fireIframeEvent(iframeElement, iframeReadyEvent());
    await sleep(1); // wait for rerender

    // simulate an update event with validation errors
    fireIframeEvent(
      iframeElement,
      iframeChangeEvent({
        validationErrorCodes: [
          {
            localeKey: "validation.card_expiry_invalid",
          },
        ],
      }),
    );
    expect(onChange).toHaveBeenCalled();

    // hidden input should be populated
    const hiddenInput = document.querySelector<HTMLInputElement>(
      'input[type="hidden"]',
    );
    assert(hiddenInput);
    expect(hiddenInput.value).toBe(
      `xendit-encrypted-1-PUBLICKEY-IV-CIPHERTEXT-invalid-${btoa("validation.card_expiry_invalid")}`,
    );
  });

  it("should handle focus and blur events", async () => {
    const sdk: XenditComponentsTest = new XenditComponentsTest({});
    await waitForEvent(sdk, "init");
    sdk.assertInitialized();

    const onChange = vi.fn();
    render(
      <XenditSessionProvider sdk={sdk} data={sdk[internal].worldState}>
        <IframeField field={field} onChange={onChange} />
      </XenditSessionProvider>,
      document.body,
    );

    const iframeElement = document.querySelector<HTMLIFrameElement>("iframe");
    assert(iframeElement);

    // hidden input should fire InternalSetFieldTouchedEvent event
    const hiddenInput = document.querySelector<HTMLInputElement>(
      'input[type="hidden"]',
    );
    assert(hiddenInput);
    const onInternalSetFieldTouchedEvent = vi.fn();
    hiddenInput.addEventListener(
      InternalSetFieldTouchedEvent.type,
      onInternalSetFieldTouchedEvent as EventListener,
    );

    // populate the public key
    fireIframeEvent(iframeElement, iframeReadyEvent());
    await sleep(1); // wait for rerender

    // simulate an update event (we need to do this because the blur handler won't fire the event if the field is empty)
    fireIframeEvent(iframeElement, iframeChangeEvent({}));
    expect(onChange).toHaveBeenCalled();

    // focus
    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-focus",
    });

    // blur
    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-blur",
    });

    expect(onInternalSetFieldTouchedEvent).toHaveBeenCalled();
  });

  it("should ignore unexpected onmessage events (events from another iframe)", async () => {
    const sdk: XenditComponentsTest = new XenditComponentsTest({});
    await waitForEvent(sdk, "init");
    sdk.assertInitialized();

    const onChange = vi.fn();
    render(
      <XenditSessionProvider sdk={sdk} data={sdk[internal].worldState}>
        <IframeField field={field} onChange={onChange} />
      </XenditSessionProvider>,
      document.body,
    );

    const iframeElement = document.querySelector<HTMLIFrameElement>("iframe");
    assert(iframeElement);

    // fire events that should be ignored
    fireIrrelevantIframeEvent(iframeReadyEvent());
    await sleep(1); // wait for rerender
    fireIrrelevantIframeEvent(iframeChangeEvent({ empty: true }));

    // nothing should happen
    expect(onChange).not.toHaveBeenCalled();
    const hiddenInput = document.querySelector<HTMLInputElement>(
      'input[type="hidden"]',
    );
    assert(hiddenInput);
    expect(hiddenInput.value).toBe("");
  });

  it("should ignore unexpected onmessage events (events from another origin)", async () => {
    const sdk: XenditComponentsTest = new XenditComponentsTest({});
    await waitForEvent(sdk, "init");
    sdk.assertInitialized();

    const onChange = vi.fn();
    render(
      <XenditSessionProvider sdk={sdk} data={sdk[internal].worldState}>
        <IframeField field={field} onChange={onChange} />
      </XenditSessionProvider>,
      document.body,
    );

    const iframeElement = document.querySelector<HTMLIFrameElement>("iframe");
    assert(iframeElement);

    // fire events that should be ignored
    fireEvilIframeEvent(iframeElement, iframeReadyEvent());
    await sleep(1); // wait for rerender
    fireEvilIframeEvent(iframeElement, iframeChangeEvent({ empty: true }));

    // nothing should happen
    expect(onChange).not.toHaveBeenCalled();
    const hiddenInput = document.querySelector<HTMLInputElement>(
      'input[type="hidden"]',
    );
    assert(hiddenInput);
    expect(hiddenInput.value).toBe("");
  });

  it("should show a shimmer while the iframe is loading", async () => {
    const sdk: XenditComponentsTest = new XenditComponentsTest({});
    await waitForEvent(sdk, "init");
    sdk.assertInitialized();

    render(
      <XenditSessionProvider sdk={sdk} data={sdk[internal].worldState}>
        <IframeField field={field} onChange={vi.fn()} />
      </XenditSessionProvider>,
      document.body,
    );

    // the shimmer covers the field
    expect(document.querySelector(".xendit-shimmer")).not.toBeNull();

    // the iframe stays mounted so it can finish loading, but is hidden
    const iframeElement = document.querySelector<HTMLIFrameElement>("iframe");
    assert(iframeElement);
    expect(iframeElement.className).toContain("xendit-iframe-hidden");
  });

  it("should hide the shimmer once the iframe is ready", async () => {
    const sdk: XenditComponentsTest = new XenditComponentsTest({});
    await waitForEvent(sdk, "init");
    sdk.assertInitialized();

    render(
      <XenditSessionProvider sdk={sdk} data={sdk[internal].worldState}>
        <IframeField field={field} onChange={vi.fn()} />
      </XenditSessionProvider>,
      document.body,
    );

    const iframeElement = document.querySelector<HTMLIFrameElement>("iframe");
    assert(iframeElement);

    fireIframeEvent(iframeElement, iframeReadyEvent());
    await sleep(1);

    expect(document.querySelector(".xendit-shimmer")).toBeNull();
    expect(
      document.querySelector<HTMLIFrameElement>("iframe")?.className,
    ).not.toContain("xendit-iframe-hidden");
  });

  it("should show an error when the iframe reports a failed init", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const sdk: XenditComponentsTest = new XenditComponentsTest({});
    await waitForEvent(sdk, "init");
    sdk.assertInitialized();

    render(
      <XenditSessionProvider sdk={sdk} data={sdk[internal].worldState}>
        <IframeField field={field} onChange={vi.fn()} />
      </XenditSessionProvider>,
      document.body,
    );

    const iframeElement = document.querySelector<HTMLIFrameElement>("iframe");
    assert(iframeElement);

    fireIframeEvent(iframeElement, { type: "xendit-iframe-failed-init" });
    await sleep(1);

    expect(document.querySelector(".xendit-iframe-field-error")).not.toBeNull();

    // the iframe stays mounted but hidden, so a late handshake can still recover the field without the user reloading the page
    const hiddenIframe = document.querySelector<HTMLIFrameElement>("iframe");
    assert(hiddenIframe);
    expect(hiddenIframe.className).toContain("xendit-iframe-hidden");
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("should show an error when the iframe never becomes ready", async () => {
    const sdk: XenditComponentsTest = new XenditComponentsTest({});
    await waitForEvent(sdk, "init");
    sdk.assertInitialized();

    render(
      <XenditSessionProvider sdk={sdk} data={sdk[internal].worldState}>
        <IframeField field={field} onChange={vi.fn()} />
      </XenditSessionProvider>,
      document.body,
    );

    // no message is ever sent; wait past the 8s deadline
    await sleep(9000);

    expect(document.querySelector(".xendit-iframe-field-error")).not.toBeNull();

    const hiddenIframe = document.querySelector<HTMLIFrameElement>("iframe");
    assert(hiddenIframe);
    expect(hiddenIframe.className).toContain("xendit-iframe-hidden");
  });

  it("should recover if the iframe becomes ready after the deadline", async () => {
    const sdk: XenditComponentsTest = new XenditComponentsTest({});
    await waitForEvent(sdk, "init");
    sdk.assertInitialized();

    render(
      <XenditSessionProvider sdk={sdk} data={sdk[internal].worldState}>
        <IframeField field={field} onChange={vi.fn()} />
      </XenditSessionProvider>,
      document.body,
    );

    const iframeElement = document.querySelector<HTMLIFrameElement>("iframe");
    assert(iframeElement);

    // the deadline elapses before the iframe answers
    await sleep(9000);
    expect(document.querySelector(".xendit-iframe-field-error")).not.toBeNull();

    // the slow iframe finally finishes loading
    fireIframeEvent(iframeElement, iframeReadyEvent());
    await sleep(1);

    expect(document.querySelector(".xendit-iframe-field-error")).toBeNull();
    expect(
      document.querySelector<HTMLIFrameElement>("iframe")?.className,
    ).not.toContain("xendit-iframe-hidden");
  });
});

function iframeReadyEvent(): IframeReadyEvent {
  return {
    type: "xendit-iframe-ready",
    ecdhPublicKey: "PUBLICKEY",
  };
}

function iframeChangeEvent(
  props: Partial<IframeChangeEvent>,
): IframeChangeEvent {
  return {
    type: "xendit-iframe-change",
    empty: false,
    valid: false,
    encrypted: [
      {
        iv: "IV",
        value: "CIPHERTEXT",
      },
    ],
    validationErrorCodes: [],
    ...props,
  };
}

function fireIframeEvent(iframe: HTMLIFrameElement, data: IframeEvent) {
  const event = new Event("message") as Writable<MessageEvent>;
  event.source = iframe.contentWindow;
  event.origin = "https://xendit-secure-iframe";
  event.data = data;
  window.dispatchEvent(event);
}

function fireIrrelevantIframeEvent(data: IframeEvent) {
  const event = new Event("message") as Writable<MessageEvent>;
  event.source = window; // not iframe
  event.origin = "https://xendit-secure-iframe";
  event.data = data;
  window.dispatchEvent(event);
}

function fireEvilIframeEvent(iframe: HTMLIFrameElement, data: IframeEvent) {
  const event = new Event("message") as Writable<MessageEvent>;
  event.source = iframe.contentWindow;
  event.origin = "https://example.com"; // wrong origin
  event.data = data;
  window.dispatchEvent(event);
}
