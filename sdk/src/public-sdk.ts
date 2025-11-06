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
  XenditSubmissionBeginEvent,
  XenditSubmissionEndEvent,
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
import { BehaviorNode, BehaviorTree } from "./lifecycle/behavior-tree-runner";
import { behaviorTreeForSdk } from "./lifecycle/behavior-tree";
import { BffSession } from "./backend-types/session";
import { BffBusiness } from "./backend-types/business";
import { BffCustomer } from "./backend-types/customer";
import { BffPaymentEntity } from "./backend-types/payment-entity";
import { SdkEventManager } from "./sdk-event-manager";
import {
  SessionActiveBehavior,
  SubmissionBehavior,
} from "./lifecycle/behaviors/session";
import {
  InternalHasInFlightRequestEvent,
  InternalUpdateWorldState,
} from "./private-event-types";
import { BffResponse, BffSucceededChannel } from "./backend-types/common";
import { mergeIgnoringUndefined, ParsedSdkKey, parseSdkKey } from "./utils";
import { makeTestSdkKey } from "./test-data";
import {
  ChannelInvalidBehavior,
  ChannelValidBehavior,
} from "./lifecycle/behaviors/channel";
import { PeRequiresActionBehavior } from "./lifecycle/behaviors/payment-entity";

/**
 * @internal
 * Represents payment channel state.
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
    behaviorTree: BehaviorTree;

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

    /**
     * If true, a submission request is in-flight (this triggers the submission-begin and submission-end events).
     */
    hasInFlightSubmissionRequest: boolean;
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
    const eventManager = new SdkEventManager(this);
    const sdkKey = parseSdkKey(publicOptions.sessionClientKey);
    this[internal] = {
      sdkKey,
      options: options,
      worldState: null,
      eventManager,
      liveComponents: {
        channelPicker: null,
        paymentChannels: new Map(),
        actionContainer: null,
      },
      activeChannelCode: null,
      behaviorTree: new BehaviorTree({
        sdkEvents: eventManager,
        sdkKey,
        mock: this.isMock(),
      }),
      hasInFlightSubmissionRequest: false,
    };

    this.behaviorTreeUpdate();

    // internal event listeners
    (this as EventTarget).addEventListener(
      InternalUpdateWorldState.type,
      this.onUpdateWorldState,
    );
    (this as EventTarget).addEventListener(
      InternalHasInFlightRequestEvent.type,
      this.onUpdateHasInFlightRequest,
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
      throw new Error(
        "The session data is not loaded. Listen for the `init` event. Only `createChannelPickerComponent` can be called before initialization.",
      );
    }
  }

  protected isMock(): boolean {
    return false;
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
    this.rerenderAllComponents();
  };

  /**
   * @internal
   * Event handler for in-flight request updates.
   */
  private onUpdateHasInFlightRequest = (event: Event) => {
    const castedEvent = event as InternalHasInFlightRequestEvent;
    this[internal].hasInFlightSubmissionRequest =
      castedEvent.hasInFlightRequest;
    this.behaviorTreeUpdate();
  };

  /**
   * @internal
   * Creates a new behavior tree based on the internal state and runs the update process.
   */
  private behaviorTreeUpdate(): void {
    let newTree: BehaviorNode<unknown[]>;
    if (!this[internal].worldState) {
      newTree = behaviorTreeForSdk({
        sdkStatus: "LOADING",
        session: null,
        sessionTokenRequestId: null,
        paymentEntity: null,
        channel: null,
        channelProperties: null,
        submissionRequestInFlight: false,
      });
    } else {
      newTree = behaviorTreeForSdk({
        sdkStatus: "ACTIVE",
        session: this[internal].worldState.session,
        sessionTokenRequestId: this[internal].worldState.sessionTokenRequestId,
        paymentEntity: this[internal].worldState.paymentEntity,
        channel: this[internal].activeChannelCode
          ? this.findChannel(this[internal].activeChannelCode)
          : null,
        channelProperties:
          this[internal].liveComponents.paymentChannels.get(
            this[internal].activeChannelCode ?? "",
          )?.channelProperties ?? null,
        submissionRequestInFlight: this[internal].hasInFlightSubmissionRequest,
      });
    }

    this[internal].behaviorTree.update(newTree);
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
   *
   * Calling this again will destroy it and return a new element. Manually
   * destroying the component is not necessary, removing it from the DOM is sufficient.
   *
   * @example
   * ```
   * const channelPickerDiv = xenditSdk.createChannelPickerComponent();
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
    // clear active channel when the channel picker accordion is closed
    container.addEventListener(XenditClearActiveChannelEvent.type, (_event) => {
      this.assertInitialized();

      // do nothing if the active channel is not in the same ui group as the event
      const event = _event as XenditClearActiveChannelEvent;
      const activeChannelCode = this[internal].activeChannelCode;
      if (!activeChannelCode) return;
      const channel = this[internal].worldState.channels.find(
        (ch) => ch.channel_code === activeChannelCode,
      );
      if (!channel || channel.ui_group !== event.uiGroup) return;

      // clear active channel
      this.setActiveChannel(null);
    });
  }

  /**
   * @public
   * Creates a UI component for making payments with a specific channel. It will
   * contain form fields, and/or instructions for the user.
   *
   * This also makes the provided channel "active", the `submit` method
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
      this.setActiveChannel(channel);
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
   * @public
   * Returns the currently active payment channel.
   */
  getActiveChannel() {
    const currentActiveChannelCode = this[internal].activeChannelCode;
    if (!currentActiveChannelCode) {
      return null;
    }
    return (
      this.getAvailablePaymentChannels().find(
        (ch) => ch.channelCode === currentActiveChannelCode,
      ) ?? null
    );
  }

  /**
   * @public
   * Makes the given channel the active channel for submission.
   *
   * The active channel:
   *  - Is interactive if it has a form (other channel compoennts are non-interactive)
   *  - Is used when `submit()` is called.
   *
   * Set to null to clear the active channel.
   */
  setActiveChannel(channel: XenditPaymentChannel | null): void {
    const currentActiveChannelCode = this[internal].activeChannelCode;

    const channelCode = channel?.[internal].channel_code ?? null;

    if (currentActiveChannelCode === channelCode) {
      // no change
      return;
    }

    // if channel is not null, the component must exist
    let component: CachedChannelComponent | null = null;
    if (channel && channelCode) {
      component =
        this[internal].liveComponents.paymentChannels.get(channelCode) ?? null;
      if (!component) {
        this.createPaymentComponentForChannel(channel, false);
        component =
          this[internal].liveComponents.paymentChannels.get(channelCode) ??
          null;
      }
    }

    // set inert on all components that are not the active one
    for (const [_, otherComponent] of this[internal].liveComponents
      .paymentChannels) {
      if (component === otherComponent) {
        if (otherComponent.element.hasAttribute("inert")) {
          otherComponent.element.removeAttribute("inert");
        }
      } else {
        otherComponent.element.setAttribute("inert", "");
      }
    }

    this[internal].activeChannelCode = channelCode;
    this.behaviorTreeUpdate();
    this.rerenderAllComponents();
  }

  /**
   * @internal
   * Handles events from the payment channel component.
   *  - Updates channel properties when they change.
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
  createActionContainerComponent(isInternal?: typeof internal): HTMLElement {
    this.assertInitialized();

    const requiresActionBehavior = this[internal].behaviorTree.findBehavior(
      PeRequiresActionBehavior,
    );
    //
    if (
      isInternal !== internal &&
      requiresActionBehavior &&
      !requiresActionBehavior.canCreateActionContainer
    ) {
      throw new Error(
        "Unable to create action container; there is an action in progress. Create an action before or during the `action-begin` event.",
      );
    }

    const container = document.createElement(
      "xendit-action-container-component",
    );

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
      return;
    }

    for (const [channelCode, cachedComponent] of this[internal].liveComponents
      .paymentChannels) {
      if (cachedComponent.element === component) {
        this[internal].liveComponents.paymentChannels.delete(channelCode);
        if (this[internal].activeChannelCode === channelCode) {
          this.setActiveChannel(null);
        }
        render(null, component);
        return;
      }
    }

    if (this[internal].liveComponents.actionContainer === component) {
      this[internal].liveComponents.actionContainer = null;
      render(null, component);
      return;
    }

    throw new Error(
      "Unable to destroy component; component not found. It may have already been destroyed.",
    );
  }

  /**
   * @public
   * Submit, makes a payment or saves a payment method for the active payment channel.
   *
   * Call this when your submit button is clicked. Listen to the events to know the status:
   *  - `submission-begin` and `submission-end` to know when submission is in progress (you should disable your UI during this time)
   *  - `action-begin` and `action-end` to know when user action is in progress
   *  - `will-redirect` when the user will be redirected to another page
   *  - `session-complete` when the payment request or token is successfully created (you should redirect the user to your confirmation page)
   *  - `session-failed` can happen at any time, but it's likely to happen on submission if the session expired or was cancelled during checkout
   *  - `not-ready` fires before `submission-begin` to indicate that you cannot submit while a submission is in progress
   *
   * When a submission fails, you can try again by calling `submit()` again.
   * (`session-failed` and `error` are fatal, submission failure is not)
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
        "Unable to submit; the session is not in the active state. Listen to the `session-complete` and `session-failed` events and display success or failure states accordingly.",
      );
    }

    const channelCode = this[internal].activeChannelCode;
    if (!channelCode) {
      throw new Error(
        "Unable to submit; there is no active payment channel. Create a payment component with `createPaymentComponentForChannel` or make an existing one active with `setActiveChannel`.",
      );
    }

    const component =
      this[internal].liveComponents.paymentChannels.get(channelCode);
    if (!component) {
      throw new Error(
        "Active channel is set but component is missing; this is a bug, please contact support.",
      );
    }

    const form = component.channelformRef?.current;
    form?.validate(); // force any form fields to display validation errors

    const channelInvalidBehavior = this[internal].behaviorTree.findBehavior(
      ChannelInvalidBehavior,
    );
    if (channelInvalidBehavior) {
      throw new Error(
        "Unable to submit; the form for the active channel has errors. Listen to the `ready` and `not-ready` events, do not allow submission while in the not-ready state.",
      );
    }

    const channelValidBehavior =
      this[internal].behaviorTree.findBehavior(ChannelValidBehavior);
    if (!channelValidBehavior) {
      throw new Error(
        "Unable to submit; the SDK is not in a valid state for submission. Listen to the `ready` and `not-ready` events, do not allow submission while in the not-ready state.",
      );
    }

    const sessionType = this[internal].worldState.session.session_type;
    sessionActiveBehavior.submit(
      sessionType,
      channelCode,
      component.channelProperties ?? {},
    );
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

    const sessionActiveBehavior = this[internal].behaviorTree.findBehavior(
      SessionActiveBehavior,
    );
    if (!sessionActiveBehavior) {
      throw new Error(
        "Submission state found but active state missing. This is a bug, please contact support.",
      );
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
 * const testSdk = new XenditSessionTestSdk({});
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

  /**
   * @internal
   * Indicates that this is a mock SDK.
   */
  protected isMock(): boolean {
    return true;
  }
}
