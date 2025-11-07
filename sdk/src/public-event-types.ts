/**
 * @public
 */
export type XenditEventListener<T extends Event> = ((event: T) => void) | null;

/**
 * @public
 */
export type XenditEventMap = {
  init: XenditInitEvent;

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
export class XenditInitEvent extends Event {
  static type = "init" as const;

  constructor() {
    super(XenditInitEvent.type, {});
  }
}

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
 * After this, a session-complete or session-failed event will be fired.
 */
export class XenditSubmissionEndEvent extends Event {
  static type = "submission-end" as const;

  constructor() {
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
