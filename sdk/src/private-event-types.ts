import { UpdatableWorldState, WorldState } from "./public-sdk";

/**
 * @public
 * Event fired when a session / paymentEntity / etc is changed.
 */
export class InternalUpdateWorldState extends Event {
  static type = "xendit-update-world-state" as const;

  constructor(public data: WorldState | UpdatableWorldState) {
    super(InternalUpdateWorldState.type, { bubbles: false });
  }
}

/**
 * @public
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
