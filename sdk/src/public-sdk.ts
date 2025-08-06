import { BffResponse } from "./bff-types";
import {
  XenditChannelPickedEvent,
  XenditChannelPickerComponent
} from "./components/channel-picker";
import { XenditPaymentChannelComponent } from "./components/payment-channel";
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
import { XenditSessionContextProvider } from "./components/session-provider";
import { internal } from "./internal";

async function fetchSessionData(
  sessionClientKey: string
): Promise<BffResponse> {
  const response = await fetch(`/api/session?clientKey=${sessionClientKey}`);
  if (!response.ok) {
    throw new Error("Failed to fetch session data");
  }
  return response.json() as Promise<BffResponse>;
}

const secret = Math.random();

/**
 * @internal
 */
type SdkConstructorOptions = {
  options: XenditSdkOptions;
  bff: BffResponse;
  secret: number;
};

/**
 * @public
 */
export class XenditSdkInstance extends EventTarget {
  private initData: SdkConstructorOptions;

  private activeChannelPickerComponent: XenditChannelPickerComponent | null =
    null;
  private activeChannelComponent: XenditPaymentChannelComponent | null = null;

  /**
   * @internal
   */
  constructor(initData: SdkConstructorOptions) {
    super();
    if (initData.secret !== secret) {
      throw new Error(
        "Don't construct this class directly, use XenditSdk.initializeSession()"
      );
    }
    this.initData = initData;
  }

  private setActiveChannelComponent = (event: Event) => {
    this.cleanupPaymentChannelComponent();
    this.activeChannelComponent = event.target as XenditPaymentChannelComponent;
  };

  /**
   * @public
   * Retrieve the xendit session object.
   */
  getSession(): XenditSession {
    return bffSessionToPublicSession(this.initData.bff.session);
  }

  /**
   * @public
   * Retrieve the list of payment channels available for this session.
   *
   * The channels are organized in a way that is appropriate to show to users.
   * You can use this to render your channel picker UI.
   */
  getAvailablePaymentChannelGroups(): XenditPaymentChannelGroup[] {
    return bffChannelsToPublicChannelGroups(this.initData.bff);
  }

  /**
   * @public
   * Retrieve an unorganized list of payment channels available for this session.
   *
   * Use this when you need to search for specific channels. When rendering your UI,
   * use `getAvailablePaymentChannelGroups` instead.
   */
  getAvailablePaymentChannels(): XenditPaymentChannel[] {
    return bffChannelsToPublicChannels(this.initData.bff.channels);
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

    const provider = document.createElement(XenditSessionContextProvider.tag);
    provider.setContextData(this.initData.bff);
    this.activeChannelPickerComponent = document.createElement(
      XenditChannelPickerComponent.tag
    );
    this.activeChannelPickerComponent.addEventListener(
      XenditChannelPickedEvent.type,
      this.setActiveChannelComponent
    );
    provider.appendChild(this.activeChannelPickerComponent);
    return provider;
  }

  private cleanupChannelPickerComponent(): void {
    if (this.activeChannelPickerComponent) {
      this.activeChannelPickerComponent.replaceChildren();
      this.activeChannelPickerComponent.removeEventListener(
        XenditChannelPickedEvent.type,
        this.setActiveChannelComponent
      );
      this.activeChannelPickerComponent = null;
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
  createPaymentComponentForChannel(channel: XenditPaymentChannel): HTMLElement {
    this.cleanupPaymentChannelComponent();
    const provider = document.createElement(XenditSessionContextProvider.tag);
    provider.setContextData(this.initData.bff);
    this.activeChannelComponent = document.createElement(
      XenditPaymentChannelComponent.tag
    );
    const internalChannel = channel[internal];
    if (!internalChannel) {
      throw new Error("Invalid channel provided");
    }
    this.activeChannelComponent.channel = internalChannel;
    provider.appendChild(this.activeChannelComponent);
    return provider;
  }

  private cleanupPaymentChannelComponent(): void {
    if (this.activeChannelComponent) {
      this.activeChannelComponent = null;
    }
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
  submit() {}

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
    listener: (this: XenditSdkInstance, ev: XenditEventMap[K]) => any,
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
): Promise<XenditSdkInstance> {
  const bff = await fetchSessionData(options.sessionClientKey);
  return new XenditSdkInstance({
    options,
    bff,
    secret
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
): Promise<XenditSdkInstance> {
  return new XenditSdkInstance({
    options,
    bff: (await import("./test-data")).makeTestBffData(),
    secret
  });
}
