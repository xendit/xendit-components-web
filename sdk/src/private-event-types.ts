import { WorldState } from "./public-sdk";

/**
 * @public
 * Event fired when an input responses to a validate event and returns
 * invalid result.
 */
export class InternalUpdateWorldState extends Event {
  static type = "xendit-update-world-state" as const;

  constructor(public data: Partial<WorldState>) {
    super(InternalUpdateWorldState.type, { bubbles: false });
  }
}
