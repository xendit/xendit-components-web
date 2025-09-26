/**
 * @public
 */
export type XenditEventListener<T extends Event> = ((event: T) => void) | null;

/**
 * @public
 */
export type XenditEventMap = {
  ready: XenditReadyEvent;
  "not-ready": XenditReadyEvent;

  "action-begin": XenditActionBeginEvent;
  "action-end": XenditActionEndEvent;

  "will-redirect": XenditWillRedirectEvent;

  "session-complete": XenditSessionCompleteEvent;
  "session-failed": XenditSessionFailedEvent;

  error: XenditErrorEvent;
};

/**
 * @public
 * Event fired when the SDK is ready to submit.
 */
export class XenditReadyEvent extends Event {
  static type = "ready" as const;

  constructor() {
    super(XenditReadyEvent.type, {});
  }
}

/**
 * @public
 * Event fired when the SDK is not ready to submit.
 */
export class XenditNotReadyEvent extends Event {
  static type = "not-ready" as const;

  constructor() {
    super(XenditNotReadyEvent.type, {});
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
export class XenditSessionFailedEvent extends Event {
  static type = "session-failed" as const;

  constructor() {
    super(XenditSessionFailedEvent.type, {});
  }
}

/**
 * @public
 * Event fired when an error occurs within the SDK and it should be
 * re-initialized or the page should be reloaded.
 */
export class XenditErrorEvent extends Event {
  static type = "error" as const;

  constructor() {
    super(XenditErrorEvent.type, {});
  }
}

/**
 * @public
 * Event fired when an input responses to a validate event and returns
 * invalid result.
 */
export class InputInvalidEvent extends Event {
  static type = "input-invalid" as const;

  constructor() {
    super(InputInvalidEvent.type, { bubbles: true });
  }
}

/**
 * @public
 * Event fired when an input starts to validate its value
 */
export class InputValidateEvent extends CustomEvent<{ value: string }> {
  static type = "input-validate" as const;

  constructor(value: string) {
    super(InputValidateEvent.type, {
      detail: { value },
    });
  }
}
