import { InternalUpdateWorldState } from "../../../private-event-types";
import { assert } from "../../../utils";
import { BlackboardType } from "../../behavior-tree";

/**
 * Marks the session as expired on the client, as if the server had returned it EXPIRED.
 */
export function expireSessionLocally(bb: BlackboardType) {
  assert(bb.world?.session);
  bb.dispatchEvent(
    new InternalUpdateWorldState({
      session: { ...bb.world.session, status: "EXPIRED", expires_ttl: 0 },
    }),
  );
}
