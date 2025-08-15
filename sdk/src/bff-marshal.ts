import { BffChannel, BffResponse, BffSession } from "./bff-types";
import { internal } from "./internal";
import {
  XenditPaymentChannel,
  XenditPaymentChannelGroup,
  XenditSession,
} from "./public-data-types";

export function bffSessionToPublicSession(
  bffSession: BffSession,
): XenditSession {
  return {
    todo: "TODO",
  };
}

export function bffChannelsToPublicChannelGroups(
  bffResponse: BffResponse,
): XenditPaymentChannelGroup[] {
  // TODO
  return [];
}

export function bffChannelToPublicChannel(
  bffChannel: BffChannel,
): XenditPaymentChannel {
  // TODO
  return {
    [internal]: bffChannel,
  };
}

export function bffChannelsToPublicChannels(
  bffChannels: BffChannel[],
): XenditPaymentChannel[] {
  return bffChannels.map(bffChannelToPublicChannel);
}
