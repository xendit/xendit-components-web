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
  XenditInitEvent,
  XenditNotReadyEvent,
  XenditReadyEvent,
  XenditSessionCompleteEvent,
  XenditSessionFailedEvent,
  XenditWillRedirectEvent,
} from "./public-event-types";
import { XenditSdkOptions } from "./public-options-types";
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
import {
  BffChannel,
  BffChannelUiGroup,
  ChannelProperties,
} from "./backend-types/channel";
import {
  PaymentChannel,
  XenditChannelPropertiesChangedEvent,
} from "./components/payment-channel";
import { fetchSessionData } from "./api";
import { ChannelFormHandle } from "./components/channel-form";
import {
  BehaviorNode,
  behaviorTreeUpdate,
  findBehaviorNodeByType,
} from "./lifecycle/behavior-tree-runner";
import { behaviorTreeForSdk } from "./lifecycle/behavior-tree";
import { BffSession } from "./backend-types/session";
import { BffBusiness } from "./backend-types/business";
import { BffCustomer } from "./backend-types/customer";
import { BffPaymentEntity } from "./backend-types/payment-entity";
import { SdkEventManager } from "./sdk-event-manager";
import { SessionActiveBehavior } from "./lifecycle/behaviors/session";
import { InternalUpdateWorldState } from "./private-event-types";
import { BffResponse } from "./backend-types/common";
import { mergeIgnoringUndefined, ParsedSdkKey, parseSdkKey } from "./utils";
import { makeTestSdkKey } from "./test-data";
import { BffSucceededChannel } from "./backend-types/succeeded-channel";
import { ChannelInvalidBehavior } from "./lifecycle/behaviors/channel";

/**
 * @internal
 */
type CachedChannelComponent = {
  element: HTMLElement;
  channelProperties: ChannelProperties | null;
  channelformRef: RefObject<ChannelFormHandle>;
};

/**
 * @internal
 * The session and associated entities.
 */
export type WorldState = {
  business: BffBusiness;
  customer: BffCustomer | null;
  session: BffSession;
  channels: BffChannel[];
  channelUiGroups: BffChannelUiGroup[];
  paymentEntity: BffPaymentEntity | null;
  sessionTokenRequestId: string | null;
  succeededChannel: BffSucceededChannel | null;
};

/**
 * @internal
 * Updatable parts of the world state. Nulls are written, undefineds are ignored.
 */
export type UpdatableWorldState = {
  [K in
    | "session"
    | "paymentEntity"
    | "sessionTokenRequestId"
    | "succeededChannel"]?: WorldState[K] | undefined;
};

type InitializedSdk = {
  [internal]: {
    worldState: WorldState;
  };
};

/**
 * @public
 */
export class XenditSessionSdk extends EventTarget {
  /**
   * @internal
   */
  protected [internal]: {
    /**
     * Parsed SDK key components.
     */
    sdkKey: ParsedSdkKey;

    /**
     * User-provided options.
     */
    options: XenditSdkOptions;

    /**
     * The session and ascociated data from the backend.
     */
    worldState: WorldState | null;

    /**
     * The event manager.
     */
    eventManager: SdkEventManager;

    /**
     * Behavior tree for state management.
     */
    behaviorTree: BehaviorNode<unknown[]> | null;

    /**
     * Components the user has created
     */
    liveComponents: {
      channelPicker: HTMLElement | null;
      paymentChannels: Map<string, CachedChannelComponent>;
      actionContainer: HTMLElement | null;
    };

    /**
     * The most recently created payment channel component's channel code.
     * This is used as a key into `paymentChannelComponents`.
     */
    activeChannelCode: string | null;
  };

  /**
   * @public
   * Initialize the SDK for a given session.
   *
   * You can get the components sdk key from the components_sdk_key field of the
   * `POST /sessions` or `GET /session` endpoints.
   *
   * This creates an object that can be used to create UI components, that allow
   * users to make payment or save tokens, using a variety of channels, depending on
   * the session configuration.
   *
   * @example
   * ```
   * // initialize
   * const xenditSdk = new XenditSessionSdk({
   *   sessionClientKey: "your-session-client-key",
   * });
   * ```
   */
  /**
   * @internal
   */
  constructor(options: XenditSdkOptions) {
    super();

    // Handle new public constructor format
    const publicOptions = options as XenditSdkOptions;
    this[internal] = {
      sdkKey: parseSdkKey(publicOptions.sessionClientKey),
      options: options,
      worldState: null,
      eventManager: new SdkEventManager(this),
      liveComponents: {
        channelPicker: null,
        paymentChannels: new Map(),
        actionContainer: null,
      },
      activeChannelCode: null,
      behaviorTree: null,
    };

    this.behaviorTreeUpdate();

    (this as EventTarget).addEventListener(
      InternalUpdateWorldState.type,
      this.onUpdateWorldState,
    );

    // Initialize session data asynchronously
    this.initializeAsync();
  }

  /**
   * @internal
   * Initialize session data asynchronously
   */
  protected async initializeAsync() {
    let bff: BffResponse;
    try {
      // Fetch session data from the server
      bff = await fetchSessionData(this[internal].sdkKey.sessionAuthKey);
    } catch (_error) {
      this.dispatchEvent(new XenditErrorEvent());
      return;
    }

    // Update world state
    this.dispatchEvent(
      new InternalUpdateWorldState({
        business: bff.business,
        customer: bff.customer,
        session: bff.session,
        channels: bff.channels,
        channelUiGroups: bff.channel_ui_groups,
        paymentEntity: null,
        sessionTokenRequestId: null,
        succeededChannel: null,
      } satisfies WorldState),
    );
  }

  /**
   * @internal
   * Throws if the SDK is not initialized.
   */
  private assertInitialized(): asserts this is InitializedSdk {
    if (!this[internal].worldState) {
      throw new Error("SDK is not initialized");
    }
  }

  private findChannel(channelCode: string) {
    this.assertInitialized();

    // TODO: use a map
    const channel = this[internal].worldState.channels.find(
      (ch) => ch.channel_code === channelCode,
    );
    return channel ?? null;
  }

  /**
   * @internal
   * Updates the session or other ascociated entities and syncs everything that depends on them.
   */
  private onUpdateWorldState = (event: Event) => {
    const data = (event as InternalUpdateWorldState).data;
    this[internal].worldState = mergeIgnoringUndefined(
      this[internal].worldState ?? ({} as WorldState),
      data,
    );

    // update behavior tree
    this.behaviorTreeUpdate();

    // re-render live components
    this.renderChannelPicker();
    for (const channelCode of this[
      internal
    ].liveComponents.paymentChannels.keys()) {
      this.renderPaymentChannel(channelCode);
    }
  };

  private behaviorTreeUpdate(): void {
    let newTree: BehaviorNode<unknown[]>;
    if (!this[internal].worldState) {
      newTree = behaviorTreeForSdk("LOADING", null, null, null, null, null);
    } else {
      newTree = behaviorTreeForSdk(
        "ACTIVE",
        this[internal].worldState.session,
        this[internal].worldState.sessionTokenRequestId,
        this[internal].worldState.paymentEntity,
        this[internal].activeChannelCode
          ? this.findChannel(this[internal].activeChannelCode)
          : null,
        this[internal].liveComponents.paymentChannels.get(
          this[internal].activeChannelCode ?? "",
        )?.channelProperties ?? null,
      );
    }

    behaviorTreeUpdate(this[internal].behaviorTree ?? undefined, newTree, {
      sdkKey: this[internal].sdkKey,
      sdkEvents: this[internal].eventManager,
    });
    this[internal].behaviorTree = newTree;
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
    this.assertInitialized();
    return bffSessionToPublicSession(this[internal].worldState.session);
  }

  /**
   * @public
   * Retrieve the list of payment channels available for this session.
   *
   * The channels are organized in a way that is appropriate to show to users.
   * You can use this to render your channel picker UI.
   */
  getAvailablePaymentChannelGroups(): XenditPaymentChannelGroup[] {
    this.assertInitialized();
    return bffChannelsToPublicChannelGroups(
      this[internal].worldState.channels,
      this[internal].worldState.channelUiGroups,
    );
  }

  /**
   * @public
   * Retrieve an unorganized list of payment channels available for this session.
   *
   * Use this when you need to search for specific channels. When rendering your UI,
   * use `getAvailablePaymentChannelGroups` instead.
   */
  getAvailablePaymentChannels(): XenditPaymentChannel[] {
    this.assertInitialized();
    return bffChannelsToPublicChannels(this[internal].worldState.channels);
  }

  /**
   * @public
   * Creates a drop-in UI component for selecting a channel and making payments.
   *
   * This returns a div immediately. The component will be populated after
   * initialization is complete. You should insert this div into the DOM.
   * To destroy it, remove it from the DOM.
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

    // Store the container for later population
    this[internal].liveComponents.channelPicker = container;

    // If initialization is complete, populate immediately
    // Otherwise, it will be populated when initializeAsync completes
    if (this[internal].worldState) {
      this.renderChannelPicker();
    }

    this.setupUiEventsForChannelPicker(container);

    return container;
  }

  /**
   * @internal
   * Render an existing channel picker element
   */
  private renderChannelPicker(): void {
    this.assertInitialized();

    const container = this[internal].liveComponents.channelPicker;
    if (!container) return;

    render(
      createElement(XenditSessionProvider, {
        data: this[internal].worldState,
        sdk: this,
        children: createElement(XenditChannelPicker, {}),
      }),
      container,
    );
  }

  private setupUiEventsForChannelPicker(container: HTMLElement): void {
    // clear active channel when the channel picker accordion is closed
    container.addEventListener(XenditClearActiveChannelEvent.type, (_event) => {
      this.assertInitialized();
      const event = _event as XenditClearActiveChannelEvent;
      const activeChannelCode = this[internal].activeChannelCode;
      if (!activeChannelCode) return;
      const channel = this[internal].worldState.channels.find(
        (ch) => ch.channel_code === activeChannelCode,
      );
      if (!channel || channel.ui_group !== event.uiGroup) return;

      this.cleanupPaymentChannelComponent();
    });
  }

  private cleanupChannelPickerComponent(): void {
    if (this[internal].liveComponents.channelPicker) {
      this[internal].liveComponents.channelPicker.replaceChildren();
      this[internal].liveComponents.channelPicker = null;
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
    this.assertInitialized();

    this.cleanupPaymentChannelComponent();

    const channelCode = channel[internal].channel_code;

    // return previously created component if it exists
    const cachedComponent =
      this[internal].liveComponents.paymentChannels.get(channelCode);
    let container: HTMLElement;
    let channelFormRef = createRef<ChannelFormHandle>();

    if (cachedComponent) {
      container = cachedComponent.element;
      channelFormRef = cachedComponent.channelformRef;
    } else {
      container = document.createElement("xendit-payment-channel");
      container.setAttribute("inert", "");
      this[internal].liveComponents.paymentChannels.set(channelCode, {
        element: container,
        channelProperties: null,
        channelformRef: channelFormRef,
      });
    }

    this.renderPaymentChannel(channelCode);
    if (active) {
      this.activatePaymentChannel(channelCode);
    }

    this.setupUiEventsForPaymentChannel(container);

    return container;
  }

  /**
   * @internal
   * Render an existing payment channel element
   */
  private renderPaymentChannel(channelCode: string): void {
    this.assertInitialized();

    const container =
      this[internal].liveComponents.paymentChannels.get(channelCode);
    if (!container) return;

    const channelObject = this.findChannel(channelCode);
    if (!channelObject) return;

    render(
      createElement(XenditSessionProvider, {
        data: this[internal].worldState,
        sdk: this,
        children: createElement(PaymentChannel, {
          channel: channelObject,
          formRef: container.channelformRef,
        }),
      }),
      container.element,
    );
  }

  /**
   * Makes the specified channel component active.
   */
  private activatePaymentChannel(channelCode: string): void {
    this.assertInitialized();

    const thisComponent =
      this[internal].liveComponents.paymentChannels.get(channelCode);
    if (!thisComponent) {
      throw new Error(`Component not found: ${channelCode}`);
    }

    // set inert on all other components and remove it from this one
    for (const [_, otherComponent] of this[internal].liveComponents
      .paymentChannels) {
      if (thisComponent === otherComponent) {
        if (otherComponent.element.hasAttribute("inert")) {
          otherComponent.element.removeAttribute("inert");
        }
      } else {
        otherComponent.element.setAttribute("inert", "");
      }
    }

    this[internal].activeChannelCode = channelCode;

    // update behavior tree (active channel and form validity have changed)
    this.behaviorTreeUpdate();
  }

  private setupUiEventsForPaymentChannel(container: HTMLElement): void {
    // update per-channel channel properties
    container.addEventListener(
      XenditChannelPropertiesChangedEvent.type,
      (_event) => {
        const event = _event as XenditChannelPropertiesChangedEvent;
        const channelCode = event.channel;
        const component =
          this[internal].liveComponents.paymentChannels.get(channelCode);
        if (!component) {
          return;
        }
        component.channelProperties = event.channelProperties;

        // update behavior tree (form validity may have changed)
        this.behaviorTreeUpdate();
      },
    );
  }

  private cleanupPaymentChannelComponent(): void {
    this[internal].activeChannelCode = null;
  }

  /**
   * Creates a container element for rendering action UIs.
   *
   * For example, 3DS or QR codes.
   *
   * You can create an action container before or during the action-begin event.
   * Creating an action container during an action will throw an error.
   *
   * If no action container is created (or if the created container is removed from the DOM or is too small),
   * the SDK will create an action container (in a modal dialog) for you.
   */
  public createActionContainerComponent(): HTMLElement {
    this.assertInitialized();

    const container = document.createElement(
      "xendit-action-container-component",
    );

    this[internal].liveComponents.actionContainer = container;

    return container;
  }

  /**
   * Destroys a component of any type created by the SDK. Removes it from the DOM if necessary.
   * Throws if the element is not a xendit component or if it was already destroyed.
   */
  public destroyComponent(component: HTMLElement): void {
    if (this[internal].liveComponents.channelPicker === component) {
      this[internal].liveComponents.channelPicker = null;
      render(null, component);
      return;
    }

    for (const [channelCode, cachedComponent] of this[internal].liveComponents
      .paymentChannels) {
      if (cachedComponent.element === component) {
        this[internal].liveComponents.paymentChannels.delete(channelCode);
        // TODO: clear up activeChannelCode if necessary
        render(null, component);
        return;
      }
    }

    if (this[internal].liveComponents.actionContainer === component) {
      this[internal].liveComponents.actionContainer = null;
      render(null, component);
      return;
    }

    throw new Error("Component not found or already destroyed");
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
    this.assertInitialized();

    const channelCode = this[internal].activeChannelCode;
    if (!channelCode) {
      throw new Error("No active payment channel component");
    }

    const component =
      this[internal].liveComponents.paymentChannels.get(channelCode);

    if (!component) {
      throw new Error("No active payment channel component");
    }

    if (!this[internal].behaviorTree) {
      throw new Error("Invalid state for session");
    }
    const sessionActiveBehavior = findBehaviorNodeByType(
      this[internal].behaviorTree,
      SessionActiveBehavior,
    );
    if (!sessionActiveBehavior) {
      throw new Error("Invalid state for session");
    }

    const form = component.channelformRef?.current;
    form?.validate();

    const channelInvalidBehavior = findBehaviorNodeByType(
      this[internal].behaviorTree,
      ChannelInvalidBehavior,
    );
    if (channelInvalidBehavior) {
      throw new Error("Cannot submit: form is invalid");
    }

    const sessionType = this[internal].worldState.session.session_type;
    switch (sessionType) {
      case "PAY":
        sessionActiveBehavior.submitCreatePaymentRequest(
          channelCode,
          component.channelProperties || {},
        );
        break;
      case "SAVE":
        sessionActiveBehavior.submitCreatePaymentToken(
          channelCode,
          component.channelProperties || {},
        );
        break;
      default:
        throw new Error(`Unsupported session type: ${sessionType}`);
    }
  }

  /**
   * Cancels a submission.
   *
   * If a submission is in-flight, the request is cancelled. If an action is in progress,
   * the action is aborted. Any active PaymentRequest or PaymentToken is abandoned.
   *
   * Does nothing if there is no active submission.
   */
  abortSubmission() {
    this.assertInitialized();

    if (!this[internal].behaviorTree) {
      throw new Error("Invalid state for session");
    }

    const sessionActiveBehavior = findBehaviorNodeByType(
      this[internal].behaviorTree,
      SessionActiveBehavior,
    );

    // we can't abort a submission if we're not in active state
    if (!sessionActiveBehavior) {
      throw new Error("Invalid state for session");
    }

    // abort any in-flight submission
    sessionActiveBehavior.abortSubmission();

    // if we have a PR/PT, clear it
    this.dispatchEvent(
      new InternalUpdateWorldState({
        paymentEntity: null,
        sessionTokenRequestId: null,
      }),
    );
  }

  /**
   * @internal
   * TODO: remove this, it's for debugging
   */
  getState() {
    const channelCode = this[internal].activeChannelCode;
    const component = this[internal].liveComponents.paymentChannels.get(
      channelCode ?? "",
    );
    return {
      channelCode,
      channelProperties: component?.channelProperties || null,
      behaviorTree: this[internal].behaviorTree,
    };
  }

  /**
   * @public
   * The `init` event lets you know when the session data has been loaded.
   *
   * The `createChannelPickerComponent` method can be called before this event, but
   * most other functionaility needs to wait for this event.
   *
   * @example
   * ```
   * xenditSdk.addEventListener("init", () => {
   *   xenditSdk.getSession();
   * });
   * ```
   */
  addEventListener(
    name: "init",
    listener: XenditEventListener<XenditInitEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;

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
 * Test version of XenditSessionSdk that uses mock data instead of API calls.
 * Use this class for testing and development purposes.
 *
 * The sessionClientKey option is ignored.
 *
 * @example
 * ```
 * const testSdk = new XenditSessionTestSdk({
 *   sessionClientKey: "test-key",
 * });
 * ```
 */
export class XenditSessionTestSdk extends XenditSessionSdk {
  /**
   * Test SDK ignores sessionClientKey and uses a mock key.
   */
  constructor(
    options: Omit<XenditSdkOptions, "sessionClientKey"> & {
      sessionClientKey?: string;
    },
  ) {
    super({
      ...options,
      sessionClientKey: makeTestSdkKey(),
    });
  }

  /**
   * @internal
   * Override to use test data instead of making API calls
   */
  protected async initializeAsync() {
    // Emit "not-ready" event initially
    this.dispatchEvent(new XenditNotReadyEvent());

    // Always use test data for this class
    const bff = (await import("./test-data")).makeTestBffData();

    // Update internal data
    this.dispatchEvent(
      new InternalUpdateWorldState({
        business: bff.business,
        customer: bff.customer,
        session: bff.session,
        channels: bff.channels,
        channelUiGroups: bff.channel_ui_groups,
        paymentEntity: null,
        sessionTokenRequestId: null,
        succeededChannel: null,
      } satisfies WorldState),
    );
  }
}
