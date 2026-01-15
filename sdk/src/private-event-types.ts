import { BffPollResponse } from "./backend-types/common";
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
 * Revalidates a field and marks it as touched.
 */
export class InternalInputValidateEvent extends CustomEvent<{ value: string }> {
  static type = "xendit-internal-input-validate" as const;

  constructor(value: string) {
    super(InternalInputValidateEvent.type, {
      detail: { value },
    });
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

/**
 * @internal
 * Set the contents of the next mock poll response.
 */
export class InternalScheduleMockUpdateEvent extends Event {
  static type = "xendit-internal-schedule-mock-update" as const;

  constructor(public mockData: BffPollResponse | null) {
    super(InternalScheduleMockUpdateEvent.type, {});
  }
}
