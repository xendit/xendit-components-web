import { BlackboardType } from "../../behavior-tree";

/**
 * When the session's TTL runs out, as a Date.now() time, or null if the session has no TTL.
 */
export function sessionExpiryTime(bb: BlackboardType) {
  const ttl = bb.world?.session.expires_ttl;
  if (ttl === undefined) {
    return null;
  }
  return bb.sessionRecvTime + ttl * 1000;
}
