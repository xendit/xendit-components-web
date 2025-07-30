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
export interface XenditReadyToSubmitEvent extends Event {
  type: "ready-to-submit";
  ready: boolean;
}

/**
 * @public
 */
export interface XenditSessionCompleteEvent extends Event {
  type: "session-complete";
}

/**
 * @public
 */
export interface XenditSessionFailedEvent extends Event {
  type: "session-failed";
}

/**
 * @public
 */
export interface XenditUserActionRequiredEvent extends Event {
  type: "user-action-required";
}

/**
 * @public
 */
export interface XenditUserActionCompleteEvent extends Event {
  type: "user-action-complete";
}

/**
 * @public
 */
export interface XenditWillRedirectEvent extends Event {
  type: "will-redirect";
}

/**
 * @public
 */
export interface XenditErrorEvent extends Event {
  type: "error";
}
