import { BffPollResponse } from "./backend-types/common";
import {
  ChannelComponentData,
  UpdatableWorldState,
  WorldState,
} from "./public-sdk";

/**
 * @internal
 * Event fired when a session / paymentEntity / etc is changed.
 *
 * Fire this on the sdk instance.
 * ! Don't fire this from within a react render
 */
export class InternalUpdateWorldState extends Event {
  static type = "xendit-update-world-state" as const;

  constructor(public data: WorldState | UpdatableWorldState) {
    super(InternalUpdateWorldState.type, { bubbles: false });
  }
}

/**
 * @internal
 * Event fired when a session / paymentEntity / etc is changed.
 *
 * Fire this on the sdk instance.
 * ! Don't fire this from within a react render
 */
export class InternalUpdateChannelComponentData extends Event {
  static type = "xendit-update-channel-component-data" as const;

  constructor(
    public channelCode: string,
    public data: Partial<ChannelComponentData>,
  ) {
    super(InternalUpdateChannelComponentData.type, { bubbles: false });
  }
}

/**
 * @internal
 * Marks it as touched, causing it to reveal validation errors.
 *
 * Fire this on the input to mark as touched.
 * Safe to fire from within a react render.
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
 *
 * Fire this on the sdk instance.
 * Safe to fire from within a react render.
 * ! Be careful to avoid infinite loops.
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
 *
 * Fire this on the sdk instance.
 * ! Don't fire this from within a react render
 */
export class InternalNeedsRerenderEvent extends Event {
  static type = "xendit-internal-needs-rerender" as const;

  constructor() {
    super(InternalNeedsRerenderEvent.type, {});
  }
}

/**
 * @internal
 * Set the contents of the next mock poll response. Replaces any other pending scheduled mock update.
 *
 * Fire this on the sdk instance.
 * Safe to fire from within a react render.
 */
export class InternalScheduleMockUpdateEvent extends Event {
  static type = "xendit-internal-schedule-mock-update" as const;

  constructor(public mockData: BffPollResponse | null) {
    super(InternalScheduleMockUpdateEvent.type, {});
  }
}
