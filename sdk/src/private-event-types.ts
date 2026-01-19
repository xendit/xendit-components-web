import { UpdatableWorldState, WorldState } from "./public-sdk";

/**
 * @internal
 * Event fired when a session / paymentEntity / etc is changed.
 */
export class InternalUpdateWorldState extends Event {
  static type = "xendit-update-world-state" as const;

  constructor(public data: WorldState | UpdatableWorldState) {
    super(InternalUpdateWorldState.type, { bubbles: false });
  }
}

/**
 * @internal
 * Marks it as touched, causing it to reveal validation errors.
 */
export class InternalSetFieldTouchedEvent extends Event {
  static type = "xendit-internal-set-field-touched" as const;

  constructor() {
    super(InternalSetFieldTouchedEvent.type, { bubbles: true });
  }
}

/**
 * @internal
 * Schedules a behavior tree update.
 */
export class InternalBehaviorTreeUpdateEvent extends Event {
  static type = "xendit-internal-behavior-tree-update" as const;

  constructor() {
    super(InternalBehaviorTreeUpdateEvent.type, {});
  }
}

/**
 * @internal
 * Schedule a rerender of all components on the next tick.
 */
export class InternalNeedsRerenderEvent extends Event {
  static type = "xendit-internal-needs-rerender" as const;

  constructor() {
    super(InternalNeedsRerenderEvent.type, {});
  }
}
