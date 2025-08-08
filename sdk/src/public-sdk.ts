import { BffResponse } from "./bff-types";
import {
  bffChannelsToPublicChannelGroups,
  bffChannelsToPublicChannels,
  bffSessionToPublicSession
} from "./bff-marshal";
import {
  XenditEventListener,
  XenditEventMap,
  XenditReadyToSubmitEvent,
  XenditSessionCompleteEvent,
  XenditSessionFailedEvent,
  XenditUserActionCompleteEvent,
  XenditUserActionRequiredEvent,
  XenditWillRedirectEvent
} from "./public-event-types";
import { XenditSdkOptions, XenditSdkTestOptions } from "./public-options-types";
import {
  XenditPaymentChannel,
  XenditPaymentChannelGroup,
  XenditSession
} from "./public-data-types";
import { internal } from "./internal";
import { createElement, render } from "preact";
import {
  XenditChannelPicker,
  XenditClearActiveChannelEvent
} from "./components/channel-picker";
import { XenditSessionProvider } from "./components/session-provider";
import { ChannelProperties } from "./forms-types";
import {
  PaymentChannel,
  XenditChannelPropertiesChangedEvent
} from "./components/payment-channel";
import { fetchSessionData } from "./network";
import {
  pickAction,
  redirectCanBeHandledInIframe,
  V3Action,
  V3PaymentRequest,
  V3PaymentToken
} from "./v3-types";
import { makeTestV3PaymentRequest } from "./test-data";

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
     * The payment request that we're currently working on.
     */
    paymentRequest: V3PaymentRequest | null;

    /**
     * The payment request that we're currently working on.
     */
    paymentToken: V3PaymentToken | null;
  };

  /**
   * @internal
   */
  constructor(initData: SdkConstructorOptions) {
    super();
    if (!initData[internal]) {
      throw new Error(
        "Don't construct this class directly, use XenditSdk.initializeSession()"
      );
    }
    this[internal] = {
      initData: initData[internal],
      activeChannelPickerComponent: null,
      activeChannelCode: null,
      paymentChannelComponents: new Map(),
      paymentRequest: null,
      paymentToken: null
    };
  }

  private setupUiEventsForChannelPicker(container: HTMLElement): void {
    // clear active channel when the channel picker accordion is closed
    container.addEventListener(XenditClearActiveChannelEvent.type, (_event) => {
      const event = _event as XenditClearActiveChannelEvent;
      const activeChannelCode = this[internal].activeChannelCode;
      if (!activeChannelCode) return;
      const channel = this[internal].initData.bff.channels.find(
        (ch) => ch.channel_code === activeChannelCode
      );
      if (!channel || channel.ui_group !== event.uiGroup) return;

      this.cleanupPaymentChannelComponent();
      this.dispatchEvent(new XenditReadyToSubmitEvent(false));
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

        this.dispatchEvent(new XenditReadyToSubmitEvent(true));
      }
    );
  }

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
    this.cleanupChannelPickerComponent();

    const container = document.createElement("xendit-channel-picker");
    this.setupUiEventsForChannelPicker(container);

    render(
      createElement(XenditSessionProvider, {
        data: this[internal].initData.bff,
        sdk: this,
        children: createElement(XenditChannelPicker, {})
      }),
      container
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
    active = true
  ): HTMLElement {
    this.cleanupPaymentChannelComponent();

    const channelCode = channel[internal].channel_code;

    let cachedComponent =
      this[internal].paymentChannelComponents.get(channelCode);
    let container: HTMLElement;
    if (cachedComponent) {
      container = cachedComponent.element;
    } else {
      container = document.createElement("xendit-payment-channel");
      this.setupUiEventsForPaymentChannel(container);
      this[internal].paymentChannelComponents.set(channelCode, {
        element: container,
        channelProperties: null
      });
    }

    render(
      createElement(XenditSessionProvider, {
        data: this[internal].initData.bff,
        sdk: this,
        children: createElement(PaymentChannel, {
          channel: channel[internal],
          active
        })
      }),
      container
    );

    if (active) {
      this[internal].activeChannelCode = channel[internal].channel_code;
      this.dispatchEvent(new XenditReadyToSubmitEvent(true));
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

    if (this[internal].initData.isTest) {
      setTimeout(() => {
        if (this[internal].initData.bff.session.session_type === "PAY") {
          this[internal].paymentRequest = makeTestV3PaymentRequest(
            this[internal].initData.bff.session,
            channelCode,
            component.channelProperties ?? {}
          );
        } else {
          // TODO
          throw new Error("Not implemented.");
        }
        this.handlePrPtStatusChange();
      });
    } else {
      // TODO
      throw new Error("Not implemented.");
    }
  }

  private handlePrPtStatusChange() {
    const prOrPt = this[internal].paymentRequest ?? this[internal].paymentToken;
    if (!prOrPt) {
      throw new Error("No payment request or token created");
    }

    switch (prOrPt.status) {
      case "REQUIRES_ACTION":
        this.dispatchEvent(new XenditUserActionRequiredEvent());
        this.handleAction(
          prOrPt.channel_properties,
          pickAction(prOrPt.actions)
        );
        break;
      case "AUTHORIZED":
      case "SUCCEEDED":
        this.dispatchEvent(new XenditSessionCompleteEvent());
        break;
      case "CANCELED":
      case "EXPIRED":
      case "FAILED":
        this.dispatchEvent(new XenditSessionFailedEvent());
        break;
      default:
        throw new Error(`Unknown payment request status: ${prOrPt.status}`);
    }
  }

  private handleAction(channelProperties: ChannelProperties, action: V3Action) {
    switch (action.type) {
      case "PRESENT_TO_CUSTOMER":
      case "REDIRECT_CUSTOMER":
        // this.createActionHandlerComponent(action);
        break;
      case "API_POST_REQUEST":
        throw new Error(`Not implemented: ${action.type} ${action.descriptor}`);
        break;
    }
    throw new Error(`Unknown action type: ${action.type}`);
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
        channelProperties: null
      };
    }
    const component = this[internal].paymentChannelComponents.get(channelCode);
    return {
      channelCode,
      channelProperties: component?.channelProperties || null
    };
  }

  /**
   * @public
   * Event handler for when the user is ready to submit.
   * This means a payment channel component exists, and any required fields have
   * been filled.
   *
   * Use this to enable your submit button.
   *
   * @example
   * ```
   * function onReadyToSubmit(event: StatusEvent) {
   *   submitButton.disabled = event.ready;
   * }
   * ```
   */
  addEventListener(
    name: "ready-to-submit",
    listener: XenditEventListener<XenditReadyToSubmitEvent>,
    options?: boolean | AddEventListenerOptions
  ): void;

  /**
   * @public
   * Event handler called on success.
   * The payment has been made and/or the token has been created.
   */
  addEventListener(
    name: "session-complete",
    listener: XenditEventListener<XenditSessionCompleteEvent>,
    options?: boolean | AddEventListenerOptions
  ): void;

  /**
   * @public
   * Event handler called when the session has expired or been cancelled.
   */
  addEventListener(
    name: "session-failed",
    listener: XenditEventListener<XenditSessionFailedEvent>,
    options?: boolean | AddEventListenerOptions
  ): void;

  /**
   * @public
   * Event handler called when the a payment request or payemnt token has been created,
   * but additional user action is required to complete the payment or create the token.
   *
   * No action is required.
   */
  addEventListener(
    name: "user-action-required",
    listener: XenditEventListener<XenditUserActionRequiredEvent>,
    options?: boolean | AddEventListenerOptions
  ): void;

  /**
   * @public
   * Event handler called when a user action is done, regardless of whether it was successful or not.
   * Some user actions are modal windows, use this event if you want to know when the modal is closed.
   *
   * No action is required.
   */
  addEventListener(
    name: "user-action-complete",
    listener: XenditEventListener<XenditUserActionCompleteEvent>,
    options?: boolean | AddEventListenerOptions
  ): void;

  /**
   * @public
   * Event handler called just before the user is redirected to a third party site to
   * complete the payment.
   *
   * No action is required.
   */
  addEventListener(
    name: "will-redirect",
    listener: XenditEventListener<XenditWillRedirectEvent>,
    options?: boolean | AddEventListenerOptions
  ): void;

  /**
   * @public
   * Event handler called when something unrecoverable has happened. You should re-initialize
   * the session or reload the page.
   */
  addEventListener(
    name: "error",
    listener: XenditEventListener<ErrorEvent>,
    options?: boolean | AddEventListenerOptions
  ): void;

  /**
   * @public
   * Fallback overload.
   */
  addEventListener<K extends keyof XenditEventMap>(
    type: K,
    listener: (this: XenditSessionSdk, ev: XenditEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;

  /**
   * @public
   * Fallback overload.
   */
  addEventListener(
    type: string,
    listener:
      | XenditEventListener<any>
      | EventListenerOrEventListenerObject
      | null,
    options?: boolean | AddEventListenerOptions
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
  options: XenditSdkOptions
): Promise<XenditSessionSdk> {
  const bff = await fetchSessionData(options.sessionClientKey);
  return new XenditSessionSdk({
    [internal]: {
      options,
      bff
    }
  });
}

/**
 * @public
 * Initialize the SDK for testing. Use this while testing your integration.
 *
 * The sessionClientKey is ignored, and a set of test data is used instead.
 */
export async function initializeTestSession(
  options: XenditSdkOptions & XenditSdkTestOptions
): Promise<XenditSessionSdk> {
  return new XenditSessionSdk({
    [internal]: {
      isTest: true,
      options,
      bff: (await import("./test-data")).makeTestBffData()
    }
  });
}
