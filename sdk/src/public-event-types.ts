/**
 * @public
 */
export type XenditEventListener<T extends Event> =
  | ((this: EventTarget, event: T) => void)
  | null;

/**
 * @public
 */
export type XenditEventMap = {
  "ready-to-submit": XenditReadyToSubmitEvent;
  "session-complete": XenditSessionCompleteEvent;
  "session-failed": XenditSessionFailedEvent;
  "user-action-required": XenditUserActionRequiredEvent;
  "user-action-complete": XenditUserActionCompleteEvent;
  "will-redirect": XenditWillRedirectEvent;
  error: XenditErrorEvent;
};

/**
 * @public
 */
export class XenditReadyToSubmitEvent extends Event {
  static type = "ready-to-submit" as const;
  ready: boolean;

  constructor(ready: boolean) {
    super(XenditReadyToSubmitEvent.type, {});
    this.ready = ready;
  }
}

/**
 * @public
 */
export class XenditSessionCompleteEvent extends Event {
  static type = "session-complete" as const;

  constructor() {
    super(XenditSessionCompleteEvent.type, {});
  }
}

/**
 * @public
 */
export class XenditSessionFailedEvent extends Event {
  static type = "session-failed" as const;

  constructor() {
    super(XenditSessionFailedEvent.type, {});
  }
}

/**
 * @public
 */
export class XenditUserActionRequiredEvent extends Event {
  static type = "user-action-required" as const;

  constructor() {
    super(XenditUserActionRequiredEvent.type, {});
  }
}

/**
 * @public
 */
export class XenditUserActionCompleteEvent extends Event {
  static type = "user-action-complete" as const;

  constructor() {
    super(XenditUserActionCompleteEvent.type, {});
  }
}

/**
 * @public
 */
export class XenditWillRedirectEvent extends Event {
  static type = "will-redirect" as const;

  constructor() {
    super(XenditWillRedirectEvent.type, {});
  }
}

/**
 * @public
 */
export class XenditErrorEvent extends Event {
  static type = "error" as const;

  constructor() {
    super(XenditErrorEvent.type, {});
  }
}
