/**
 * @public
 */
export type XenditEventMap = {
  init: XenditInitEvent;

  "submission-ready": XenditReadyEvent;
  "submission-not-ready": XenditReadyEvent;

  "action-begin": XenditActionBeginEvent;
  "action-end": XenditActionEndEvent;

  "will-redirect": XenditWillRedirectEvent;

  "session-complete": XenditSessionCompleteEvent;
  "session-expired-or-canceled": XenditSessionExpiredOrCanceledEvent;

  "payment-request-created": XenditPaymentRequestCreatedEvent;
  "payment-request-discarded": XenditPaymentRequestDiscardedEvent;
  "payment-token-created": XenditPaymentTokenCreatedEvent;
  "payment-token-discarded": XenditPaymentTokenDiscardedEvent;

  "fatal-error": XenditFatalErrorEvent;
};

/**
 * @public
 */
export type XenditEventListener<
  T extends Event | XenditEventMap[keyof XenditEventMap],
> = ((event: T) => void) | null;

/**
 * @public
 * Event fired when the Session is loaded.
 */
export class XenditInitEvent extends Event {
  static type = "init" as const;

  constructor() {
    super(XenditInitEvent.type, {});
  }
}

/**
 * @public
 * Event fired when the SDK fails in an unrecoverable way.
 */
export class XenditFatalErrorEvent extends Event {
  static type = "fatal-error" as const;

  constructor(
    /**
     * A detailed error message for developers. Don't show this to users.
     */
    public message: string,
  ) {
    super(XenditFatalErrorEvent.type, {});
  }
}

/**
 * @public
 * Event fired when the SDK is ready to submit.
 */
export class XenditReadyEvent extends Event {
  static type = "submission-ready" as const;

  constructor(public channelCode: string) {
    super(XenditReadyEvent.type, {});
  }
}

/**
 * @public
 * Event fired when the SDK is not ready to submit.
 */
export class XenditNotReadyEvent extends Event {
  static type = "submission-not-ready" as const;

  constructor() {
    super(XenditNotReadyEvent.type, {});
  }
}

/**
 * @public
 * Event fired after submission begins.
 */
export class XenditSubmissionBeginEvent extends Event {
  static type = "submission-begin" as const;

  constructor() {
    super(XenditSubmissionBeginEvent.type, {});
  }
}

/**
 * @public
 * Event fired when a submission is complete or fails. Submission encompasses creation of a
 * payment request or payment token, and any actions the user needs to complete.
 *
 * Includes details about why the submission ended, and error messages if applicable.
 */
export class XenditSubmissionEndEvent extends Event {
  static type = "submission-end" as const;

  constructor(
    /**
     * The reason why the submission ended.
     */
    public reason: string,
    /**
     * An error message to show to the user. A title and 1-2 lines of localized text.
     */
    public userErrorMessage?: string[],
    /**
     * A detailed error message for developers.
     */
    public developerErrorMessage?: {
      /**
       * The type of error.
       * - NETWORK_ERROR: A network error occurred while creating the payment request or payment token.
       * - ERROR: Failed to created a payment request or payment token.
       * - FAILURE: A payment request or payment token transitioned to a failure state.
       */
      type: "NETWORK_ERROR" | "ERROR" | "FAILURE";
      /**
       * The code associated with the error.
       */
      code: string;
    },
  ) {
    super(XenditSubmissionEndEvent.type, {});
  }
}

/**
 * @public
 * Event sometimes fired after submission, if an action is required.
 */
export class XenditActionBeginEvent extends Event {
  static type = "action-begin" as const;

  constructor() {
    super(XenditActionBeginEvent.type, {});
  }
}

/**
 * @public
 * Event fired when an action ends, success or fail.
 */
export class XenditActionEndEvent extends Event {
  static type = "action-end" as const;

  constructor() {
    super(XenditActionEndEvent.type, {});
  }
}

/**
 * @public
 * Event fired when the a redirect action is about to happen.
 */
export class XenditWillRedirectEvent extends Event {
  static type = "will-redirect" as const;

  constructor() {
    super(XenditWillRedirectEvent.type, {});
  }
}

/**
 * @public
 * Event fired when the session is complete, meaning the payment has been processed
 * or the token has been created.
 */
export class XenditSessionCompleteEvent extends Event {
  static type = "session-complete" as const;

  constructor() {
    super(XenditSessionCompleteEvent.type, {});
  }
}

/**
 * @public
 * Event fired when the session has failed, meaning expired or cancelled.
 */
export class XenditSessionExpiredOrCanceledEvent extends Event {
  static type = "session-expired-or-canceled" as const;

  constructor() {
    super(XenditSessionExpiredOrCanceledEvent.type, {});
  }
}

/**
 * @public
 */
export class XenditPaymentRequestCreatedEvent extends Event {
  static type = "payment-request-created" as const;

  constructor(public paymentRequestId: string) {
    super(XenditPaymentRequestCreatedEvent.type, {});
  }
}

/**
 * @public
 */
export class XenditPaymentTokenCreatedEvent extends Event {
  static type = "payment-token-created" as const;

  constructor(public paymentTokenId: string) {
    super(XenditPaymentTokenCreatedEvent.type, {});
  }
}

/**
 * @public
 */
export class XenditPaymentRequestDiscardedEvent extends Event {
  static type = "payment-request-discarded" as const;

  constructor(public paymentRequestId: string) {
    super(XenditPaymentRequestDiscardedEvent.type, {});
  }
}

/**
 * @public
 */
export class XenditPaymentTokenDiscardedEvent extends Event {
  static type = "payment-token-discarded" as const;

  constructor(public paymentTokenId: string) {
    super(XenditPaymentTokenDiscardedEvent.type, {});
  }
}
