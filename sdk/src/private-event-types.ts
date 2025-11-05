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
 * Event fired to indicate whether a create PR or create PT request is in-flight.
 */
export class InternalHasInFlightRequestEvent extends Event {
  static type = "xendit-has-in-flight-submission-request" as const;

  constructor(public hasInFlightRequest: boolean) {
    super(InternalHasInFlightRequestEvent.type, { bubbles: false });
  }
}
