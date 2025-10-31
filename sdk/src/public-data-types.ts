import { BffChannel } from "./backend-types/channel";
import { internal } from "./internal";

/**
 * @public
 */
export interface XenditSession {
  todo: string;
}

/**
 * @public
 */
export interface XenditPaymentChannel {
  channelCode: string;
  /** @internal */
  [internal]: BffChannel;
}

/**
 * @public
 */
export interface XenditPaymentChannelGroup {
  todo: string;
}
