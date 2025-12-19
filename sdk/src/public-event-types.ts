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

  constructor(public message: string) {
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
 * Event sometimes fired after submission.
 */
export class XenditSubmissionBeginEvent extends Event {
  static type = "submission-begin" as const;

  constructor() {
    super(XenditSubmissionBeginEvent.type, {});
  }
}

/**
 * @public
 * Event sometimes fired when a submission is complete, including the action.
 * After this, a session-complete or session-expired-or-canceled event will be fired.
 */
export class XenditSubmissionEndEvent extends Event {
  static type = "submission-end" as const;

  constructor(
    public reason: string,
    public data?: {
      errorCode?: string;
      errorContent?: {
        title: string;
        message_1: string;
        message_2?: string;
      };
      failure?: {
        title: string;
        subtext: string;
        failureCode?: string;
      };
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
