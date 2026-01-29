import {
  XenditActionBeginEvent,
  XenditActionEndEvent,
  XenditFatalErrorEvent,
  XenditEventListener,
  XenditEventMap,
  XenditInitEvent,
  XenditPaymentRequestCreatedEvent,
  XenditPaymentRequestDiscardedEvent,
  XenditPaymentTokenCreatedEvent,
  XenditPaymentTokenDiscardedEvent,
  XenditReadyEvent,
  XenditSessionCompleteEvent,
  XenditSessionExpiredOrCanceledEvent,
  XenditSubmissionBeginEvent,
  XenditSubmissionEndEvent,
  XenditWillRedirectEvent,
} from "./public-event-types";
import {
  XenditSdkOptions as XenditComponentsOptions,
  XenditGetChannelsOptions,
} from "./public-options-types";
import {
  XenditCustomer,
  XenditPaymentChannel,
  XenditPaymentChannelGroup,
  XenditSession,
} from "./public-data-types";
import { internal } from "./internal";
import { createElement, createRef, RefObject, render } from "preact";
import {
  XenditChannelPicker,
  XenditClearCurrentChannelEvent,
} from "./components/channel-picker";
import { XenditSessionProvider } from "./components/session-provider";
import {
  BffChannel,
  BffChannelUiGroup,
  ChannelProperties,
  ChannelPropertyPrimative,
} from "./backend-types/channel";
import {
  PaymentChannel,
  XenditChannelPropertiesChangedEvent,
  XenditSavePaymentMethodChangedEvent,
} from "./components/payment-channel";
import { fetchSessionData } from "./api";
import { ChannelFormHandle } from "./components/channel-form";
import { BehaviorTree } from "./lifecycle/behavior-tree-runner";
import {
  behaviorTreeForSdk,
  BlackboardType,
  SdkStatus,
} from "./lifecycle/behavior-tree";
import { BffSession } from "./backend-types/session";
import { BffBusiness } from "./backend-types/business";
import { BffCustomer } from "./backend-types/customer";
import { BffPaymentEntity } from "./backend-types/payment-entity";
import { SessionActiveBehavior } from "./lifecycle/behaviors/session";
import {
  InternalBehaviorTreeUpdateEvent,
  InternalNeedsRerenderEvent,
  InternalScheduleMockUpdateEvent,
  InternalUpdateWorldState,
} from "./private-event-types";
import {
  BffPollResponse,
  BffResponse,
  BffSucceededChannel,
} from "./backend-types/common";
import {
  canBeSimulated,
  errorToString,
  lockDownInteralProperty,
  mergeIgnoringUndefined,
  MOCK_NETWORK_DELAY_MS,
  ParsedSdkKey,
  parseSdkKey,
  removeUnreleasedChannels,
  resolvePairedChannel,
  satisfiesMinMax,
  sleep,
} from "./utils";
import { makeTestSdkKey } from "./test-data";
import {
  ChannelInvalidBehavior,
  ChannelValidBehavior,
} from "./lifecycle/behaviors/channel";
import { PeRequiresActionBehavior } from "./lifecycle/behaviors/payment-entity";
import { SubmissionBehavior } from "./lifecycle/behaviors/submission";
import {
  bffChannelsToPublic,
  bffCustomerToPublic,
  bffSessionToPublic,
  bffUiGroupsToPublic,
  findChannelPairs,
} from "./bff-marshal";
import { BffCardDetails } from "./backend-types/card-details";
import { initI18n } from "./localization";
import { TFunction } from "i18next";
import { amountFormat } from "./amount-format";

/**
 * @internal
 * Represents payment channel state.
 */
type CachedChannelComponent = {
  element: HTMLElement;
  channel: XenditPaymentChannel;
  channelProperties: ChannelProperties | null;
  channelFormRef: RefObject<ChannelFormHandle>;
  savePaymentMethod: boolean;
};

/**
 * @internal
 * The session and associated entities that we get from the backend.
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
  cardDetails: {
    cardNumber: string | null;
    details: BffCardDetails | null;
  };
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
    | "succeededChannel"
    | "cardDetails"]?: WorldState[K] | undefined;
};

/**
 * @internal
 * Used to assert that the SDK is initialized.
 */
type InitializedSdk = {
  [internal]: {
    worldState: WorldState;
  };
};

/**
 * @public
 */
export class XenditComponents extends EventTarget {
  /**
   * @internal
   */
  public t: TFunction<"session"> = ((str: string): string => {
    throw new Error("Localization used before initialization; this is a bug.");
  }) as TFunction<"session">;

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
    options: XenditComponentsOptions;

    /**
     * The session and ascociated data from the backend.
     */
    worldState: WorldState | null;

    /**
     * Behavior tree for state management.
     */
    behaviorTree: BehaviorTree<BlackboardType>;

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
    currentChannelCode: string | null;

    /**
     * Tracks which event listeners are present on the SDK instance.
     */
    eventListenersPresent: Map<string, boolean>;
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
   * const components = new XenditComponents({
   *   componentsSdkKey: "your-session-client-key",
   * });
   * ```
   */
  constructor(options: XenditComponentsOptions) {
    super();

    if (typeof window === "undefined" || typeof document === "undefined") {
      throw new Error("XenditComponents can only be instantiated in a browser");
    }

    const sdkKey = parseSdkKey(options.componentsSdkKey);
    this[internal] = {
      sdkKey,
      options,
      worldState: null,
      liveComponents: {
        channelPicker: null,
        paymentChannels: new Map(),
        actionContainer: null,
      },
      behaviorTree: new BehaviorTree<BlackboardType>(behaviorTreeForSdk, {
        sdk: this,
        sdkKey,
        mock: this.isMock(),
        sdkStatus: "LOADING",
        sdkFatalErrorMessage: null,
        channel: null,
        channelProperties: null,
        dispatchEvent: this.dispatchEvent.bind(this),
        world: null,
        submissionRequested: false,
        simulatePaymentRequested: false,
        actionCompleted: false,
        pollImmediatelyRequested: false,
        savePaymentMethod: null,
      }),
      currentChannelCode: null,
      eventListenersPresent: new Map(),
    };
    lockDownInteralProperty(this as unknown as { [internal]: unknown });

    // log fatal errors if user didn't attach a listener
    this.addEventListener("fatal-error", (event) => {
      const fatalErrorEvent = event as XenditFatalErrorEvent;
      if (!this[internal].eventListenersPresent.get("fatal-error")) {
        console.error(
          `XenditComponents: A "fatal-error" event occurred but no event listener was attached: ${fatalErrorEvent.message}`,
        );
      }
    });
    this[internal].eventListenersPresent.set("fatal-error", false);

    this.behaviorTreeUpdate();

    // internal event listeners
    (this as EventTarget).addEventListener(
      InternalUpdateWorldState.type,
      this.onUpdateWorldState.bind(this),
    );
    (this as EventTarget).addEventListener(
      InternalBehaviorTreeUpdateEvent.type,
      this.behaviorTreeUpdate.bind(this),
    );
    let hasScheduledRender = false;
    (this as EventTarget).addEventListener(
      InternalNeedsRerenderEvent.type,
      () => {
        if (hasScheduledRender) return;
        hasScheduledRender = true;
        queueMicrotask(() => {
          hasScheduledRender = false;
          this.rerenderAllComponents();
          this.syncInertAttribute();
        });
      },
    );

    // Initialize session data asynchronously
    this.initializeAsync();
  }

  /**
   * @internal
   * Initialize session data asynchronously
   */
  protected async initializeAsync(): Promise<void> {
    let bff: BffResponse;
    try {
      // Fetch session data from the server
      bff = await fetchSessionData(
        this[internal].sdkKey,
        this[internal].sdkKey.sessionAuthKey,
      );
      bff.channels = removeUnreleasedChannels(bff.channels);
    } catch (error) {
      this[internal].behaviorTree.bb.sdkStatus = "FATAL_ERROR";
      this[internal].behaviorTree.bb.sdkFatalErrorMessage =
        errorToString(error);
      this.behaviorTreeUpdate();
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
        cardDetails: {
          cardNumber: null,
          details: null,
        },
      } satisfies WorldState),
    );
  }

  /**
   * @internal
   * Throws if the SDK is not initialized.
   */
  public assertInitialized(): asserts this is InitializedSdk {
    if (!this[internal].worldState) {
      throw new Error(
        "The session data is not loaded. Listen for the `init` event. Only `createChannelPickerComponent` can be called before initialization.",
      );
    }
  }

  /**
   * @internal
   */
  public isMock(): boolean {
    return false;
  }

  /**
   * @internal
   */
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
  private onUpdateWorldState(event: Event) {
    const data = (event as InternalUpdateWorldState).data;
    this[internal].worldState = mergeIgnoringUndefined(
      this[internal].worldState ?? ({} as WorldState),
      data,
    );

    // update locale
    const locale = this[internal].worldState.session.locale;
    const i18n = initI18n(locale);
    this.t = i18n.getFixedT(locale, "session");

    // update everything
    this.behaviorTreeUpdate();
    this.rerenderAllComponents();
  }

  /**
   * @internal
   * Updates the behavior tree with the latest world state and component state.
   */
  private behaviorTreeUpdate(): void {
    const bb = this[internal].behaviorTree.bb;

    if (bb.sdkStatus === "LOADING" && this[internal].worldState) {
      bb.sdkStatus = "ACTIVE";
    }

    bb.world = this[internal].worldState;

    const component = this[internal].currentChannelCode
      ? this[internal].liveComponents.paymentChannels.get(
          this[internal].currentChannelCode,
        )
      : null;
    bb.channel = component
      ? resolvePairedChannel(
          component.channel[internal],
          component.savePaymentMethod,
        )
      : null;
    bb.channelProperties = component ? component.channelProperties : null;
    bb.savePaymentMethod = component ? component.savePaymentMethod : null;

    try {
      this[internal].behaviorTree.update();
    } catch (error) {
      // crash handler, move to fatal error state
      this[internal].behaviorTree.bb.sdkStatus = "FATAL_ERROR";
      this[internal].behaviorTree.bb.sdkFatalErrorMessage =
        errorToString(error);
      this[internal].behaviorTree.update();
    }
  }

  /**
   * @internal
   * Return the current SDK status.
   */
  public getSdkStatus(): SdkStatus {
    // TODO: pass this as a prop into SessionProvider instead
    return this[internal].behaviorTree.bb.sdkStatus;
  }

  /**
   * @internal
   * Rerender everything.
   */
  private rerenderAllComponents() {
    // re-render live components
    this.renderChannelPicker();
    for (const channelCode of this[
      internal
    ].liveComponents.paymentChannels.keys()) {
      this.renderPaymentChannel(channelCode);
    }
  }

  /**
   * @public
   * Retrieve the xendit session object.
   */
  getSession(): XenditSession {
    this.assertInitialized();
    return bffSessionToPublic(this[internal].worldState.session);
  }

  /**
   * @public
   * Retrieve the customer ascociated with the session.
   */
  getCustomer(): XenditCustomer | null {
    this.assertInitialized();
    if (!this[internal].worldState.customer) return null;
    return bffCustomerToPublic(this[internal].worldState.customer);
  }

  /**
   * @public
   * Retrieve the list of payment channels available for this session.
   *
   * The channels are organized in a way that is appropriate to show to users.
   * You can use this to render your channel picker UI.
   *
   * You can pass `{filter: "CHANNEL_CODE"}` to filter channels by string or regexp.
   */
  getActiveChannelGroups(
    options?: XenditGetChannelsOptions,
  ): XenditPaymentChannelGroup[] {
    this.assertInitialized();
    return bffUiGroupsToPublic(
      this[internal].worldState.channels,
      this[internal].worldState.channelUiGroups,
      {
        options: {
          filter: options?.filter,
          filterMinMax: options?.filterMinMax ?? true,
        },
        session: this[internal].worldState.session,
        pairChannels: findChannelPairs(this[internal].worldState.channels),
      },
    );
  }

  /**
   * @public
   * Retrieve an unorganized list of payment channels available for this session.
   *
   * Use this when you need to search for specific channels. When rendering your UI,
   * consider using `getActiveChannelGroups` if you support many channels.
   *
   * You can pass `{filter: "CHANNEL_CODE"}` to filter channels by string or regexp.
   */
  getActiveChannels(
    options?: XenditGetChannelsOptions,
  ): XenditPaymentChannel[] {
    this.assertInitialized();
    return bffChannelsToPublic(
      this[internal].worldState.channels,
      this[internal].worldState.channelUiGroups,
      {
        options: {
          filter: options?.filter,
          filterMinMax: options?.filterMinMax ?? true,
        },
        session: this[internal].worldState.session,
        pairChannels: findChannelPairs(this[internal].worldState.channels),
      },
    );
  }

  /**
   * @public
   * Creates a drop-in UI component for selecting a channel and making payments.
   *
   * This returns a div immediately. The component will be populated after
   * initialization is complete. You should insert this div into the DOM.
   *
   * Calling this again will destroy it and return a new element. Manually
   * destroying the component is not necessary, removing it from the DOM is sufficient.
   *
   * @example
   * ```
   * const channelPickerDiv = components.createChannelPickerComponent();
   * document.querySelector(".payment-container").appendChild(channelPickerDiv);
   * ```
   */
  createChannelPickerComponent(): HTMLElement {
    // destroy previous instance if it exists
    if (this[internal].liveComponents.channelPicker) {
      this.destroyComponent(this[internal].liveComponents.channelPicker);
    }

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

  /**
   * @internal
   * Handles events from the channel picker component.
   */
  private setupUiEventsForChannelPicker(container: HTMLElement): void {
    // clear current channel when the channel picker accordion is closed
    container.addEventListener(
      XenditClearCurrentChannelEvent.type,
      (_event) => {
        this.assertInitialized();

        // do nothing if the current channel is not in the same ui group as the event
        const event = _event as XenditClearCurrentChannelEvent;
        const currentChannelCode = this[internal].currentChannelCode;
        if (!currentChannelCode) return;
        const channel = this[internal].worldState.channels.find(
          (ch) => ch.channel_code === currentChannelCode,
        );
        if (!channel || channel.ui_group !== event.uiGroup) return;

        // clear active channel
        this.setCurrentChannel(null);
      },
    );
  }

  /**
   * @public
   * Creates a UI component for making payments with a specific channel. It will
   * contain form fields, and/or instructions for the user.
   *
   * This also makes the provided channel "current", the `submit` method
   * will use that channel.
   *
   * This returns a div. You should insert this div into the DOM. Creating a new
   * component multiple times for the same channel will return the same component instance.
   *
   * Destroying the component manually is not necessary, removing it from the DOM is sufficient,
   * but if you want to clear the form state, you can do so with the `destroyComponent` method.
   *
   * @example
   * ```
   * const cardsChannel = components.getActiveChannels({ filter: "CARDS" })[0];
   * const paymentComponent = components.createChannelComponent(cardsChannel);
   * document.querySelector(".payment-container").appendChild(paymentComponent);
   * ```
   */
  createChannelComponent(
    channel: XenditPaymentChannel,
    active = true,
  ): HTMLElement {
    this.assertInitialized();

    if (
      !satisfiesMinMax(this[internal].worldState.session, channel[internal][0])
    ) {
      throw new Error(
        `Cannot create channel component: \`session.amount\` is outside of the channel's min/max amount.`,
      );
    }

    const channelCode = channel[internal][0].channel_code;

    if (active) {
      // make it active (before creating the component)
      this[internal].currentChannelCode = channelCode;
    }

    // return previously created component if it exists
    const cachedComponent =
      this[internal].liveComponents.paymentChannels.get(channelCode);
    let container: HTMLElement;
    let channelFormRef = createRef<ChannelFormHandle>();

    if (cachedComponent) {
      container = cachedComponent.element;
      channelFormRef = cachedComponent.channelFormRef;
    } else {
      container = document.createElement("xendit-payment-channel");
      container.setAttribute("data-channel-code", channelCode);
      container.setAttribute("inert", "");
      this.setupUiEventsForPaymentChannel(container);

      this[internal].liveComponents.paymentChannels.set(channelCode, {
        element: container,
        channel,
        channelProperties: null,
        channelFormRef: channelFormRef,
        savePaymentMethod: false,
      });
    }

    this.renderPaymentChannel(channelCode);
    if (active) {
      this.behaviorTreeUpdate();
      this.syncInertAttribute();
    }

    // rerender other components next tick because we may already be in a render
    this.dispatchEvent(new InternalNeedsRerenderEvent());

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

    const channelObject = container.channel;

    render(
      createElement(XenditSessionProvider, {
        data: this[internal].worldState,
        sdk: this,
        children: createElement(PaymentChannel, {
          channels: channelObject[internal],
          savePaymentMethod: container.savePaymentMethod,
          formRef: container.channelFormRef,
        }),
      }),
      container.element,
    );
  }

  /**
   * @public
   * Returns the current payment channel.
   */
  getCurrentChannel() {
    const currentChannelCode = this[internal].currentChannelCode;
    if (!currentChannelCode) {
      return null;
    }
    return (
      this.getActiveChannels().find((ch) => {
        if (
          ch.channelCode === currentChannelCode ||
          (Array.isArray(ch.channelCode) &&
            ch.channelCode.includes(currentChannelCode))
        ) {
          return true;
        }
      }) ?? null
    );
  }

  /**
   * @public
   * Makes the given channel the current channel for submission.
   *
   * The current channel:
   *  - Is interactive if it has a form (other channel components are non-interactive)
   *  - Is used when `submit()` is called.
   *
   * Set to null to clear the current channel.
   */
  setCurrentChannel(channel: XenditPaymentChannel | null): void {
    const currentChannelCode = this[internal].currentChannelCode;

    const channelCode = channel?.[internal][0].channel_code ?? null;

    if (currentChannelCode === channelCode) {
      // no change
      return;
    }

    this[internal].currentChannelCode = channelCode;

    // if channel is not null, the component must exist
    let component: CachedChannelComponent | null = null;
    if (channel && channelCode) {
      component =
        this[internal].liveComponents.paymentChannels.get(channelCode) ?? null;
      if (!component) {
        this.createChannelComponent(channel, false);
        component =
          this[internal].liveComponents.paymentChannels.get(channelCode) ??
          null;
      }
    }

    this.behaviorTreeUpdate();
    this.syncInertAttribute();
    this.renderChannelPicker();
  }

  /**
   * @internal
   * Ensure all components have the correct inert attribute. This needs to be called when the current channel changes or a submission starts or ends.
   */
  syncInertAttribute() {
    // all channel components should have `inert` unless they are the current channel and there is no submission in progress
    const hasSubmissionInProgress =
      this[internal].behaviorTree.bb.submissionRequested;
    const channelComponents = this[internal].liveComponents.paymentChannels;

    for (const [_, component] of channelComponents) {
      const channelCode = Array.isArray(component.channel.channelCode)
        ? component.channel.channelCode[0]
        : component.channel.channelCode;
      if (
        channelCode === this[internal].currentChannelCode &&
        !hasSubmissionInProgress
      ) {
        if (component.element.hasAttribute("inert")) {
          component.element.removeAttribute("inert");
        }
      } else {
        component.element.setAttribute("inert", "");
      }
    }
  }

  /**
   * @internal
   * Handles events from the payment channel component.
   *  - Updates channel properties when they change.
   *  - Updates save payment method setting when it changes.
   */
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

    // update save payment method setting
    container.addEventListener(
      XenditSavePaymentMethodChangedEvent.type,
      (_event) => {
        const event = _event as XenditSavePaymentMethodChangedEvent;
        const channelCode = event.channel;
        const component =
          this[internal].liveComponents.paymentChannels.get(channelCode);
        if (!component) {
          return;
        }

        component.savePaymentMethod = event.savePaymentMethod;
        this.behaviorTreeUpdate();

        // TODO: need to re-collect all channel properties since form fields may have been added or removed
        this.rerenderAllComponents();
      },
    );
  }

  /**
   * @public
   *
   * Reveals any hidden validation errors in the current channel's form. Does nothing if
   * there are no validation errors to show.
   *
   * Normally, validation errors on required fields are not shown if the user did not touch them.
   */
  showValidationErrors(): void {
    const channelInvalidBehavior = this[internal].behaviorTree.findBehavior(
      ChannelInvalidBehavior,
    );
    if (!channelInvalidBehavior) {
      // form is not invalid
      return;
    }

    const channelCode = this[internal].currentChannelCode;
    if (!channelCode) {
      // no current channel
      return;
    }

    const component =
      this[internal].liveComponents.paymentChannels.get(channelCode);
    if (!component) {
      throw new Error(
        "Current channel is set but component is missing; this is a bug, please contact support.",
      );
    }

    const form = component.channelFormRef.current;
    form?.setAllFieldsTouched();
  }

  /**
   * @public
   * Creates a container element for rendering action UIs.
   *
   * For example, 3DS or QR codes.
   *
   * Create an action container before or during the action-begin event, and
   * the action UI will be rendered inside it.
   * Creating an action container during an action will throw an error.
   *
   * If no action container is created (or if the created container is removed from the DOM or is too small),
   * the SDK will create an action container (in a modal dialog) for you.
   */
  createActionContainerComponent(): HTMLElement;

  /**
   * @internal If isInternal is passed, it bypasses the action-in-progress check.
   **/
  createActionContainerComponent(isInternal: typeof internal): HTMLElement;

  // implementation
  createActionContainerComponent(isInternal?: typeof internal): HTMLElement {
    this.assertInitialized();

    if (this[internal].liveComponents.actionContainer) {
      this.destroyComponent(this[internal].liveComponents.actionContainer);
    }

    const requiresActionBehavior = this[internal].behaviorTree.findBehavior(
      PeRequiresActionBehavior,
    );
    if (
      isInternal !== internal &&
      requiresActionBehavior &&
      !requiresActionBehavior.canCreateActionContainer
    ) {
      throw new Error(
        "Unable to create action container; there is an action in progress. Create an action before or during the `action-begin` event.",
      );
    }

    const container = document.createElement("xendit-action-container");

    this[internal].liveComponents.actionContainer = container;

    return container;
  }

  /**
   * @public
   * Destroys a component of any type created by the SDK. Removes it from the DOM if necessary.
   * Throws if the element is not a xendit component or if it was already destroyed.
   */
  destroyComponent(component: HTMLElement): void {
    if (!component.tagName.startsWith("XENDIT-")) {
      throw new Error(
        "Unable to destroy component; only elements created by this SDK can be destroyed.",
      );
    }

    if (this[internal].liveComponents.channelPicker === component) {
      this[internal].liveComponents.channelPicker = null;
      render(null, component);
      component.remove();
      return;
    }

    for (const [channelCode, cachedComponent] of this[internal].liveComponents
      .paymentChannels) {
      if (cachedComponent.element === component) {
        this[internal].liveComponents.paymentChannels.delete(channelCode);
        if (this[internal].currentChannelCode === channelCode) {
          this.setCurrentChannel(null);
        }
        render(null, component);
        component.remove();
        return;
      }
    }

    if (this[internal].liveComponents.actionContainer === component) {
      this[internal].liveComponents.actionContainer = null;
      render(null, component);
      component.remove();
      return;
    }

    throw new Error(
      "Unable to destroy component; component not found. It may have already been destroyed.",
    );
  }

  /**
   * @public
   * Submit, makes a payment or saves a payment method for the current payment channel.
   *
   * Call this when your submit button is clicked. Listen to the events to know the status:
   *  - `submission-begin` and `submission-end` to know when submission is in progress (you should disable your UI during this time). Submission-end also provides a reason.
   *  - `action-begin` and `action-end` to know when user action is in progress
   *  - `will-redirect` when the user will be redirected to another page
   *  - `payment-[request|token]-[created|discarded]` informs you of the ID of the resource we create on the backend, and if/when it is discarded
   *  - `session-complete` when the payment request or token is successfully created (you should redirect the user to your confirmation page)
   *  - `session-expired-or-canceled` can happen at any time, but it's likely to happen on submission if the session expired or was cancelled during checkout
   *  - `submission-not-ready` fires before `submission-begin` to indicate that you cannot submit while a submission is in progress
   *
   * When a submission fails, you can try again by calling `submit()` again.
   * (The `session-expired-or-canceled` and `fatal-error` events are fatal, submission failure is normal and recoverable)
   *
   * This corresponds to the endpoints:
   *  - `POST /v3/payment_requests` for PAY sessions
   *  - `POST /v3/payment_tokens` for SAVE sessions
   */
  submit() {
    this.assertInitialized();

    const sessionActiveBehavior = this[internal].behaviorTree.findBehavior(
      SessionActiveBehavior,
    );
    if (!sessionActiveBehavior) {
      throw new Error(
        "Unable to submit; the session is not in the active state. Listen to the `session-complete` and `session-expired-or-canceled` events and display success or failure states accordingly.",
      );
    }

    const channelCode = this[internal].currentChannelCode;
    if (!channelCode) {
      throw new Error(
        "Unable to submit; there is no current payment channel. Create a payment component with `createChannelComponent` or make an existing one active with `setCurrentChannel`.",
      );
    }

    const component =
      this[internal].liveComponents.paymentChannels.get(channelCode);
    if (!component) {
      throw new Error(
        "Current channel is set but component is missing; this is a bug, please contact support.",
      );
    }

    // ensure if user submits in invalid state, errors are visible
    this.showValidationErrors();

    const channelInvalidBehavior = this[internal].behaviorTree.findBehavior(
      ChannelInvalidBehavior,
    );
    if (channelInvalidBehavior) {
      throw new Error(
        "Unable to submit; the form for the current channel has errors. Listen to the `submission-ready` and `submission-not-ready` events, do not allow submission while in the not-ready state.",
      );
    }

    const channelValidBehavior =
      this[internal].behaviorTree.findBehavior(ChannelValidBehavior);
    if (!channelValidBehavior) {
      throw new Error(
        "Unable to submit; the SDK is not in a valid state for submission. Listen to the `submission-ready` and `submission-not-ready` events, do not allow submission while in the not-ready state.",
      );
    }

    this[internal].behaviorTree.bb.submissionRequested = true;
    this.behaviorTreeUpdate();

    this.syncInertAttribute();
  }

  /**
   * @public
   * Cancels a submission.
   *
   * If a submission is in-flight, the request is cancelled. If an action is in progress,
   * the action is aborted. Any active PaymentRequest or PaymentToken is abandoned.
   *
   * Does nothing if there is no active submission.
   */
  abortSubmission() {
    this.assertInitialized();

    const submissionBehavior =
      this[internal].behaviorTree.findBehavior(SubmissionBehavior);
    if (!submissionBehavior) {
      return; // no submission in progress
    }

    this[internal].behaviorTree.bb.submissionRequested = false;
    this.behaviorTreeUpdate();
  }

  /**
   * @public
   * Completes a payment in test mode.
   *
   * The session must be in test mode, and the session type must be PAY, and
   * the sdk must have an in-progress action, and the channel must be a QR, VA, or OTC channel.
   *
   * @example
   * ```
   * components.addEventListener("action-begin", () => {
   *   components.simulatePayment();
   * });
   * ```
   */
  simulatePayment() {
    this.assertInitialized();

    if (this[internal].worldState.session.session_type !== "PAY") {
      throw new Error(
        'Unable to simulate payment, the session type is not "PAY".',
      );
    }

    const requiresActionBehavior = this[internal].behaviorTree.findBehavior(
      PeRequiresActionBehavior,
    );
    if (!requiresActionBehavior) {
      throw new Error(
        "Unable to simulate payment; there is no action in progress. You can simulate payments any time between the `action-begin` and `action-end` events.",
      );
    }

    const paymentEntity = this[internal].worldState.paymentEntity;
    if (!paymentEntity) {
      throw new Error(
        "The PeRequiresActionBehavior is present but there is no payment entity. This is a bug, please contact support.",
      );
    }

    const channel = this.findChannel(paymentEntity.entity.channel_code);

    if (!channel) {
      throw new Error(
        "Channel not found; this is a bug, please contact support.",
      );
    }

    if (!canBeSimulated(channel)) {
      throw new Error(
        "Unable to simulate payment; the payment channel does not support simulation.",
      );
    }

    this[internal].behaviorTree.bb.simulatePaymentRequested = true;
    this.behaviorTreeUpdate();
  }

  /**
   * @public
   * Request an immediate poll for session status. Useful for handling payment
   * affirmation (e.g. I have made the payment) by the user. The session must still
   * be active.
   *
   * @example
   * ```
   * function onUserAffirmPayment() {
   *   components.pollImmediately();
   * }
   * ```
   */
  pollImmediately() {
    this.assertInitialized();

    if (this[internal].worldState.session.status !== "ACTIVE") {
      throw new Error(
        "Unable to poll immediately; the session is not longer active.",
      );
    }

    this[internal].behaviorTree.bb.pollImmediatelyRequested = true;
    this.behaviorTreeUpdate();
  }

  /**
   * @internal
   * TODO: remove this, it's for debugging
   */
  getState() {
    const channelCode = this[internal].currentChannelCode;
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
   * components.addEventListener("init", () => {
   *   components.getSession();
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
   * The `submission-ready` and `submission-not-ready` events let you know when submission should be available.
   * If ready, you can call `submit()` to begin the payment or token creation process.
   *
   * "submission-ready" means a channel has been selected, and all required fields are populated,
   * and all fields are valid.
   *
   * Use this to enable/disable your submit button.
   *
   * @example
   * ```
   * components.addEventListener("submission-ready", () => {
   *   submitButton.disabled = false;
   * });
   * components.addEventListener("submission-not-ready", () => {
   *   submitButton.disabled = true;
   * });
   * ```
   */
  addEventListener(
    name: "submission-ready",
    listener: XenditEventListener<XenditReadyEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    name: "submission-not-ready",
    listener: XenditEventListener<XenditReadyEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;

  /**
   * @public
   * The `submission-begin` and `submission-end` events let you know when a submission is in progress.
   *
   * Use this to disable your UI while submission is in progress.
   *
   * In the case of successful submission, `submission-end` will be followed by `session-complete`.
   * In the case of failed submission, the SDK will return to the ready state and you can try submitting again.
   */
  addEventListener(
    name: "submission-begin",
    listener: XenditEventListener<XenditSubmissionBeginEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    name: "submission-end",
    listener: XenditEventListener<XenditSubmissionEndEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;

  /**
   * @public
   * The events `payment-request-created`, `payment-token-created`, `payment-request-discarded`, and `payment-token-discarded`
   * let you know when a payment request or payment token has been created (as part of a submission) or
   * discarded (by cancelling or failing a submission).
   */
  addEventListener(
    name: "payment-request-created",
    listener: XenditEventListener<XenditPaymentRequestCreatedEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    name: "payment-token-created",
    listener: XenditEventListener<XenditPaymentTokenCreatedEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    name: "payment-request-discarded",
    listener: XenditEventListener<XenditPaymentRequestDiscardedEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    name: "payment-token-discarded",
    listener: XenditEventListener<XenditPaymentTokenDiscardedEvent>,
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
    name: "session-expired-or-canceled",
    listener: XenditEventListener<XenditSessionExpiredOrCanceledEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;

  /**
   * @public
   * Event handler called when something unrecoverable has happened. You should create a new
   * session and a new SDK instance.
   */
  addEventListener(
    name: "fatal-error",
    listener: XenditEventListener<XenditFatalErrorEvent>,
    options?: boolean | AddEventListenerOptions,
  ): void;

  /**
   * @public
   * Fallback overload.
   */
  addEventListener<K extends keyof XenditEventMap>(
    type: K,
    listener: (this: XenditComponents, ev: XenditEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;

  /**
   * @internal
   * Implementation.
   */
  addEventListener(
    type: string,
    listener: unknown,
    options?: boolean | AddEventListenerOptions,
  ): void {
    this[internal].eventListenersPresent.set(type, true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.addEventListener(type, listener as any, options);
  }

  /**
   * @public
   * Fallback overload.
   */
  removeEventListener<K extends keyof XenditEventMap>(
    type: K,
    listener: (this: XenditComponents, ev: XenditEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;

  /**
   * @internal
   * Implementation.
   */
  removeEventListener(
    type: string,
    listener: unknown,
    options?: boolean | AddEventListenerOptions,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.removeEventListener(type, listener as any, options);
  }

  static amountFormat(amount: number, currency: string): string {
    return amountFormat(amount, currency);
  }
}

/**
 * @public
 * Test version of XenditComponents that uses mock data instead of API calls.
 * Use this class for testing and development purposes.
 *
 * The componentsSdkKey option is ignored.
 *
 * @example
 * ```
 * const testSdk = new XenditComponentsTest({});
 * ```
 */
export class XenditComponentsTest extends XenditComponents {
  /**
   * @internal
   * The mock to apply on the next poll.
   */
  public nextMockUpdate: BffPollResponse | null = null;

  /**
   * @public
   * Test SDK ignores componentsSdkKey and uses a mock key.
   */
  constructor(
    options: Omit<XenditComponentsOptions, "componentsSdkKey"> & {
      componentsSdkKey?: string;
    },
  ) {
    super({
      ...options,
      componentsSdkKey: makeTestSdkKey(),
    });

    // internal event listeners
    (this as EventTarget).addEventListener(
      InternalScheduleMockUpdateEvent.type,
      this.setNextMockUpdate.bind(this),
    );
  }

  /**
   * @internal
   * Override to use test data instead of making API calls
   */
  protected async initializeAsync(): Promise<void> {
    // Simulate network delay and prevent firing the init event before the constructor returns
    await sleep(MOCK_NETWORK_DELAY_MS);

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
        cardDetails: {
          cardNumber: null,
          details: null,
        },
      } satisfies WorldState),
    );
  }

  /**
   * @internal
   * Indicates that this is a mock SDK.
   */
  public isMock(): boolean {
    return true;
  }

  /**
   * @internal
   * Sets the next mock update to use.
   */
  setNextMockUpdate(_event: Event): void {
    const event = _event as InternalScheduleMockUpdateEvent;
    this.nextMockUpdate = event.mockData;
  }
}

// re-exports
export type { ChannelProperties, ChannelPropertyPrimative };
