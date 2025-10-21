import {
  bffChannelsToPublicChannelGroups,
  bffChannelsToPublicChannels,
  bffSessionToPublicSession,
} from "./bff-marshal";
import {
  XenditActionBeginEvent,
  XenditActionEndEvent,
  XenditErrorEvent,
  XenditEventListener,
  XenditEventMap,
  XenditNotReadyEvent,
  XenditReadyEvent,
  XenditSessionCompleteEvent,
  XenditSessionFailedEvent,
  XenditWillRedirectEvent,
} from "./public-event-types";
import { XenditSdkOptions, XenditSdkTestOptions } from "./public-options-types";
import {
  XenditPaymentChannel,
  XenditPaymentChannelGroup,
  XenditSession,
} from "./public-data-types";
import { internal } from "./internal";
import { createElement, createRef, RefObject, render } from "preact";
import {
  XenditChannelPicker,
  XenditClearActiveChannelEvent,
} from "./components/channel-picker";
import { XenditSessionProvider } from "./components/session-provider";
import { ChannelProperties } from "./backend-types/channel";
import {
  PaymentChannel,
  XenditChannelPropertiesChangedEvent,
} from "./components/payment-channel";
import { fetchSessionData } from "./api";
import Submitter from "./submitter";
import { ChannelFormHandle } from "./components/channel-form";
import { BffResponse } from "./backend-types/common";

/**
 * @internal
 */
type SdkConstructorOptions = {
  [internal]: {
    isTest?: boolean;
    options: XenditSdkOptions;
    bff: BffResponse;
  };
};

/**
 * @internal
 */
type CachedChannelComponent = {
  element: HTMLElement;
  channelProperties: ChannelProperties | null;
  channelformRef: RefObject<ChannelFormHandle>;
};

/**
 * @public
 */
export class XenditSessionSdk extends EventTarget {
  /**
   * @internal
   */
  private [internal]: {
    /**
     * Session data from backend.
     */
    initData: SdkConstructorOptions[typeof internal];

    /**
     * The channel picker element
     **/
    activeChannelPickerComponent: HTMLElement | null;

    /**
     * The most recently created payment channel component's channel code.
     * This is used as a key into `paymentChannelComponents`.
     */
    activeChannelCode: string | null;

    /**
     * Map of channel code to the channel's respective HTMLElement and form state.
     */
    paymentChannelComponents: Map<string, CachedChannelComponent>;

    /**
     * Payment submission controller.
     * TODO: remove this
     */
    submitter: Submitter | null;

    /**
     * If true, we are done, either successfully or not.
     */
    terminal: boolean;
  };

  /**
   * @internal
   */
  constructor(initData: SdkConstructorOptions) {
    super();
    if (!initData[internal]) {
      throw new Error(
        "Don't construct this class directly, use XenditSdk.initializeSession()",
      );
    }
    this[internal] = {
      initData: initData[internal],
      activeChannelPickerComponent: null,
      activeChannelCode: null,
      paymentChannelComponents: new Map(),
      submitter: null,
      terminal: false,
    };

    // on next tick, emit "not-ready" event
    setTimeout(() => {
      this.dispatchEvent(new XenditNotReadyEvent());
    }, 0);
  }

  private setupUiEventsForChannelPicker(container: HTMLElement): void {
    // clear active channel when the channel picker accordion is closed
    container.addEventListener(XenditClearActiveChannelEvent.type, (_event) => {
      const event = _event as XenditClearActiveChannelEvent;
      const activeChannelCode = this[internal].activeChannelCode;
      if (!activeChannelCode) return;
      const channel = this[internal].initData.bff.channels.find(
        (ch) => ch.channel_code === activeChannelCode,
      );
      if (!channel || channel.ui_group !== event.uiGroup) return;

      this.cleanupPaymentChannelComponent();
      this.dispatchEvent(new XenditNotReadyEvent());
    });
  }

  private setupUiEventsForPaymentChannel(container: HTMLElement): void {
    // update per-channel channel properties
    container.addEventListener(
      XenditChannelPropertiesChangedEvent.type,
      (_event) => {
        const event = _event as XenditChannelPropertiesChangedEvent;
        const channelCode = event.channel;
        const component =
          this[internal].paymentChannelComponents.get(channelCode);
        if (!component) {
          return;
        }
        component.channelProperties = event.channelProperties;

        this.dispatchEvent(new XenditReadyEvent());
      },
    );
  }

  /**
   * @public
   * Environment name. Affects which version of the secure iframe is used.
   */
  public env = "production";

  /**
   * @public
   * Retrieve the xendit session object.
   */
  getSession(): XenditSession {
    return bffSessionToPublicSession(this[internal].initData.bff.session);
  }

  /**
   * @public
   * Retrieve the list of payment channels available for this session.
   *
   * The channels are organized in a way that is appropriate to show to users.
   * You can use this to render your channel picker UI.
   */
  getAvailablePaymentChannelGroups(): XenditPaymentChannelGroup[] {
    return bffChannelsToPublicChannelGroups(this[internal].initData.bff);
  }

  /**
   * @public
   * Retrieve an unorganized list of payment channels available for this session.
   *
   * Use this when you need to search for specific channels. When rendering your UI,
   * use `getAvailablePaymentChannelGroups` instead.
   */
  getAvailablePaymentChannels(): XenditPaymentChannel[] {
    return bffChannelsToPublicChannels(this[internal].initData.bff.channels);
  }

  /**
   * @public
   * Creates a drop-in UI component for selecting a channel and making payments.
   *
   * This returns a div. You should insert this div into the DOM. To destroy it,
   * remove it from the DOM.
   *
   * @example
   * ```
   * const channelPickerDiv = xenditSdk.createChannelPickerComponent();
   * document.querySelector(".payment-container").appendChild(channelPickerDiv);
   * ```
   */
  createChannelPickerComponent(): HTMLElement {
    if (this[internal].terminal) {
      throw new Error("Session is in terminal state, cannot create components");
    }

    this.cleanupChannelPickerComponent();

    const container = document.createElement("xendit-channel-picker");
    this.setupUiEventsForChannelPicker(container);

    render(
      createElement(XenditSessionProvider, {
        data: this[internal].initData.bff,
        sdk: this,
        children: createElement(XenditChannelPicker, {}),
      }),
      container,
    );

    this[internal].activeChannelPickerComponent = container;

    return container;
  }

  private cleanupChannelPickerComponent(): void {
    if (this[internal].activeChannelPickerComponent) {
      this[internal].activeChannelPickerComponent.replaceChildren();
      this[internal].activeChannelPickerComponent = null;
    }
  }

  /**
   * @public
   * Creates a UI component for making payments with a specific channel.
   *
   * This returns a div. You should insert this div into the DOM. To destroy it,
   * remove it from the DOM.
   *
   * Only one payment component can be active at a time. The most recently created
   * component is always "active". Inactive components are disabled (their contents are given `dispaly: none`),
   * but they still exist, and can be resurrected by calling this method again with the same channel.
   *
   * @example
   * ```
   * const cardsChannel = xenditSdk.getAvailablePaymentChannels().find(ch => ch.channelCode === "CARDS");
   * const paymentComponent = xenditSdk.createPaymentComponentForChannel(cardsChannel);
   * document.querySelector(".payment-container").appendChild(paymentComponent);
   * ```
   */
  createPaymentComponentForChannel(
    channel: XenditPaymentChannel,
    active = true,
  ): HTMLElement {
    if (this[internal].terminal) {
      throw new Error("Session is in terminal state, cannot create components");
    }

    this.cleanupPaymentChannelComponent();

    const channelCode = channel[internal].channel_code;

    // return previously created component if it exists
    const cachedComponent =
      this[internal].paymentChannelComponents.get(channelCode);
    let container: HTMLElement;
    let channelFormRef = createRef<ChannelFormHandle>();

    if (cachedComponent) {
      container = cachedComponent.element;
      channelFormRef = cachedComponent.channelformRef;
    } else {
      container = document.createElement("xendit-payment-channel");
      this.setupUiEventsForPaymentChannel(container);
      this[internal].paymentChannelComponents.set(channelCode, {
        element: container,
        channelProperties: null,
        channelformRef: channelFormRef,
      });
    }

    // ensure all other components are inert and this one is not
    for (const [code, component] of this[internal].paymentChannelComponents) {
      if (code === channelCode) {
        if (component.element.hasAttribute("inert")) {
          component.element.removeAttribute("inert");
        }
      } else {
        component.element.setAttribute("inert", "");
      }
    }

    render(
      createElement(XenditSessionProvider, {
        data: this[internal].initData.bff,
        sdk: this,
        children: createElement(PaymentChannel, {
          channel: channel[internal],
          active,
          formRef: channelFormRef,
        }),
      }),
      container,
    );

    if (active) {
      this[internal].activeChannelCode = channel[internal].channel_code;

      // TODO: emit this on channel properties changed, if the form is valid
      this.dispatchEvent(new XenditReadyEvent());
    }

    return container;
  }

  private cleanupPaymentChannelComponent(): void {
    this[internal].activeChannelCode = null;
  }

  /**
   * @public
   * Submit.
   *
   * Call this when your submit button is clicked. Listen to the status event
   * for the result.
   *
   * This corresponds to the POST /v3/payment_requests or POST /v3/payment_tokens endpoints,
   * to create a payment request or token, depending on the type of session.
   */
  submit() {
    const channelCode = this[internal].activeChannelCode;
    if (!channelCode) {
      throw new Error("No active payment channel component");
    }

    const component = this[internal].paymentChannelComponents.get(channelCode);

    if (!component) {
      throw new Error("No active payment channel component");
    }

    const form = component.channelformRef?.current;

    if (form) {
      const isFormValid = form.validate();
      if (!isFormValid) {
        return;
      }
    }

    this[internal].submitter = new Submitter(
      this,
      this[internal].initData.bff.session,
      channelCode,
      component.channelProperties || {},
      this[internal].initData.isTest || false,
      (error?: Error) => {
        this[internal].submitter = null;
        if (!error) {
          // session complete
          this.dispatchEvent(new XenditSessionCompleteEvent());
          this.enterTerminalState();
        }
      },
    );
    this[internal].submitter.begin();
  }

  /**
   * @internal
   * Clean up everything, don't do anything else from now on, we are done.
   */
  private enterTerminalState() {
    this[internal].terminal = true;
    this.cleanupChannelPickerComponent();
    for (const component of this[internal].paymentChannelComponents.values()) {
      component.element.replaceChildren();
    }
    this[internal].paymentChannelComponents.clear();
    this[internal].activeChannelCode = null;
  }

  /**
   * @internal
   * TODO: remove this, it's for debugging
   */
  getState() {
    const channelCode = this[internal].activeChannelCode;
    if (!channelCode) {
      return {
        channelCode: null,
        channelProperties: null,
      };
    }
    const component = this[internal].paymentChannelComponents.get(channelCode);
    return {
      channelCode,
      channelProperties: component?.channelProperties || null,
    };
  }

  /**
   * @public
   * The `ready` and `not-ready` events let you know when submission should be available.
   * If ready, you can call `submit()` to begin the payment or token creation process.
   *
   * "ready" means a channel has been selected, and all required fields are populated,
   * and all fields are valid.
   *
   * Use this to enable/disable your submit button.
   *
   * @example
   * ```
   * xenditSdk.addEventListener("ready", () => {
   *   submitButton.disabled = false;
   * });
   * xenditSdk.addEventListener("not-ready", () => {
   *   submitButton.disabled = true;
   * });
   * ```
   */
  addEventListener(
    name: "ready",
    listener: XenditEventListener<XenditReadyEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    name: "not-ready",
    listener: XenditEventListener<XenditReadyEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;

  /**
   * @public
   * The `action-begin` and `action-end` events let you know when a user action is in progress.
   *
   * After submission, an action may be required (e.g. 3DS, redirect, QR code, etc.).
   * The SDK will control the UI for actions, you don't need to do anything.
   *
   * Avoid changing any application state while an action is in progress as it may be
   * confusing for the user or interrupt their payment attempt.
   *
   * `action-end` is fired after the action is done, successfully or not. Note that users can
   * voluntarily dismiss actions.
   */
  addEventListener(
    name: "action-begin",
    listener: XenditEventListener<XenditActionBeginEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    name: "action-end",
    listener: XenditEventListener<XenditActionEndEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;

  /**
   * @public
   * Event handler called just before the user is redirected to a third party site to
   * complete the payment.
   *
   * Since redirects are actions, this will always be preceded by an `action-begin` event.
   */
  addEventListener(
    name: "will-redirect",
    listener: XenditEventListener<XenditWillRedirectEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;

  /**
   * @public
   * Event handler called on success.
   * The payment has been made and/or the token has been created.
   */
  addEventListener(
    name: "session-complete",
    listener: XenditEventListener<XenditSessionCompleteEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;

  /**
   * @public
   * Event handler called when the session has expired or been cancelled.
   */
  addEventListener(
    name: "session-failed",
    listener: XenditEventListener<XenditSessionFailedEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;

  /**
   * @public
   * Event handler called when something unrecoverable has happened. You should re-initialize
   * the session or reload the page.
   */
  addEventListener(
    name: "error",
    listener: XenditEventListener<XenditErrorEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;

  /**
   * @public
   * Fallback overload.
   */
  addEventListener<K extends keyof XenditEventMap>(
    type: K,
    listener: (this: XenditSessionSdk, ev: XenditEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;

  /**
   * @public
   * Fallback overload.
   */
  addEventListener(
    type: string,
    listener:
      | XenditEventListener<Event>
      | EventListenerOrEventListenerObject
      | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    return super.addEventListener(type, listener, options);
  }
}

/**
 * @public
 * Initialize the SDK for a given session.
 *
 * You can get the session client key from the client_key field of the
 * `POST /sessions` or `GET /session` endpoints.
 *
 * This returns an object that can be used to create UI components, that allow
 * users to make payment or save tokens, using a variety of channels, depending on
 * the session configuration.
 *
 * This will throw if the session is expired, cancelled, already complete,
 * or on network errors.
 *
 * @example
 * ```
 * // initialize
 * const xenditSdk = await XenditSdk.initializeSession({
 *   sessionClientKey: "your-session-client-key",
 * });
 *
 * // either create a channel picker component...
 * const channelPicker = xenditSdk.createChannelPickerComponent();
 * document.querySelector(".payment-container").appendChild(channelPicker);
 *
 * // ...or create a payment component for a specific channel
 * const cardsChannel = xenditSdk.getAvailablePaymentChannels().find(ch => ch.channelCode === "CARDS");
 * const paymentComponent = xenditSdk.createPaymentComponentForChannel(cardsChannel);
 * document.querySelector(".payment-container").appendChild(paymentComponent);
 * ```
 */
export async function initializeSession(
  options: XenditSdkOptions,
): Promise<XenditSessionSdk> {
  const bff = await fetchSessionData(undefined, options.sessionClientKey);
  return new XenditSessionSdk({
    [internal]: {
      options,
      bff,
    },
  });
}

/**
 * @public
 * Initialize the SDK for testing. Use this while testing your integration.
 *
 * The sessionClientKey is ignored, and a set of test data is used instead.
 */
export async function initializeTestSession(
  options: XenditSdkOptions & XenditSdkTestOptions,
): Promise<XenditSessionSdk> {
  return new XenditSessionSdk({
    [internal]: {
      isTest: true,
      options,
      bff: (await import("./test-data")).makeTestBffData(),
    },
  });
}
