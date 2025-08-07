import { BffChannel } from "./bff-types";
import { internal } from "./internal";

/**
 * @public
 */
export interface XenditSession {}

/**
 * @public
 */
export interface XenditPaymentChannel {
  /** @internal */
  [internal]: BffChannel;
}

/**
 * @public
 */
export interface XenditPaymentChannelGroup {}
