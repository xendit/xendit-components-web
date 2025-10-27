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
