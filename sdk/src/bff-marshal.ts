import { BffChannel, BffChannelUiGroup } from "./backend-types/channel";
import { BffCustomer } from "./backend-types/customer";
import { BffSession } from "./backend-types/session";
import { internal } from "./internal";
import {
  XenditCustomer,
  XenditPaymentChannel,
  XenditPaymentChannelGroup,
  XenditSession,
} from "./public-data-types";
import {
  assert,
  assertEquals,
  assertNotEquals,
  removeUndefinedPropertiesFromObject,
  satisfiesMinMax,
} from "./utils";

type XenditItem = NonNullable<XenditSession["items"]>[number];

export function bffSessionToPublic(bffSession: BffSession): XenditSession {
  assertNotEquals(bffSession.session_type, "AUTHORIZATION");
  assertEquals(bffSession.mode, "COMPONENTS");

  return removeUndefinedPropertiesFromObject<XenditSession>({
    id: bffSession.payment_session_id,
    description: bffSession.description || undefined,
    sessionType: bffSession.session_type,
    mode: bffSession.mode,
    referenceId: bffSession.reference_id,
    country: bffSession.country,
    currency: bffSession.currency,
    amount: bffSession.amount,
    channelProperties: bffSession.channel_properties || undefined,
    expiresAt: new Date(bffSession.expires_at),
    locale: bffSession.locale,
    status: bffSession.status,

    items: bffSession.items?.map((item) => {
      return removeUndefinedPropertiesFromObject<XenditItem>({
        type: item.type,
        referenceId: item.reference_id,
        name: item.name,
        netUnitAmount: item.net_unit_amount,
        quantity: item.quantity,
        url: item.url,
        image_url: item.image_url,
        category: item.category,
        subcategory: item.subcategory,
        description: item.description,
        metadata: item.metadata,
      });
    }),
  });
}

export function bffCustomerToPublic(bffCustomer: BffCustomer): XenditCustomer {
  assertEquals(bffCustomer.type, "INDIVIDUAL");
  assert(bffCustomer.individual_detail);
  return {
    id: bffCustomer.id,
    type: bffCustomer.type,
    email: bffCustomer.email ?? undefined,
    mobileNumber: bffCustomer.mobile_number ?? undefined,
    individualDetail: {
      givenNames: bffCustomer.individual_detail.given_names ?? undefined,
      surname: bffCustomer.individual_detail.surname ?? undefined,
    },
  };
}

type ChannelMarshalConfig = {
  options: {
    filter?: string | string[] | RegExp;
    filterMinMax: boolean;
  };
  pairChannels: PairChannelData;
  session: Pick<BffSession, "amount" | "session_type">;
};

/**
 * Generate public channel groups list.
 */
export function bffUiGroupsToPublic(
  bffChannels: BffChannel[],
  bffChannelGroups: BffChannelUiGroup[],
  marshalConfig: ChannelMarshalConfig,
): XenditPaymentChannelGroup[] {
  const groupsByGroupId = makeGroupsByGroupId(bffChannelGroups);
  const channelsByGroupId = makeChannelsByGroupId(bffChannels, marshalConfig);
  return bffChannelGroups
    .filter((group) => channelsByGroupId[group.id]?.length)
    .map((group) => {
      return bffUiGroupToPublic(
        group,
        channelsByGroupId,
        groupsByGroupId,
        marshalConfig,
      );
    });
}

/**
 * Generate one public channel group.
 */
export function bffUiGroupToPublic(
  bffChannelGroup: BffChannelUiGroup,
  channelsByGroupId: Record<string, BffChannel[]>,
  groupsByGroupId: Record<string, BffChannelUiGroup>,
  marshalConfig: ChannelMarshalConfig,
) {
  return removeUndefinedPropertiesFromObject<XenditPaymentChannelGroup>({
    groupId: bffChannelGroup.id,
    label: bffChannelGroup.label,
    get channels() {
      return (channelsByGroupId[bffChannelGroup.id] || []).map((channel) => {
        return bffChannelToPublic(
          channel,
          channelsByGroupId,
          groupsByGroupId,
          marshalConfig,
        );
      });
    },
    [internal]: bffChannelGroup,
  });
}

/**
 * Generate one public channel, without group data.
 */
export function singleBffChannelToPublic(
  bffChannel: BffChannel,
  marshalConfig: ChannelMarshalConfig,
): XenditPaymentChannel {
  return bffChannelToPublic(bffChannel, {}, {}, marshalConfig);
}

/**
 * Generate one public channel.
 */
export function bffChannelToPublic(
  bffChannel: BffChannel,
  bffChannelsByGroupId: Record<string, BffChannel[]>,
  bffGroupsByGroupId: Record<string, BffChannelUiGroup>,
  marshalConfig: ChannelMarshalConfig,
): XenditPaymentChannel {
  assert(!marshalConfig.pairChannels.paired[bffChannel.channel_code]);

  return removeUndefinedPropertiesFromObject<XenditPaymentChannel>({
    channelCode:
      marshalConfig.pairChannels.pairs[bffChannel.channel_code]?.map(
        (ch) => ch.channel_code,
      ) ?? bffChannel.channel_code,
    brandName: bffChannel.brand_name,
    brandColor: bffChannel.brand_color,
    brandLogoUrl: bffChannel.brand_logo_url,
    get uiGroup() {
      if (!bffGroupsByGroupId[bffChannel.ui_group]) {
        throw new Error("UI group not found");
      }
      return bffUiGroupToPublic(
        bffGroupsByGroupId[bffChannel.ui_group],
        bffChannelsByGroupId,
        bffGroupsByGroupId,
        marshalConfig,
      );
    },
    minAmount: bffChannel.min_amount,
    maxAmount: bffChannel.max_amount,
    cardBrands: bffChannel.card?.brands.map((b) => {
      return {
        name: b.name,
        logoUrl: b.logo_url,
      };
    }),
    [internal]: marshalConfig.pairChannels.pairs[bffChannel.channel_code] ?? [
      bffChannel,
    ],
  });
}

/**
 * Generate public channels list.
 */
export function bffChannelsToPublic(
  bffChannels: BffChannel[],
  bffChannelGroups: BffChannelUiGroup[],
  marshalConfig: ChannelMarshalConfig,
): XenditPaymentChannel[] {
  const groupsByGroupId = makeGroupsByGroupId(bffChannelGroups);
  const channelsByGroupId = makeChannelsByGroupId(bffChannels, marshalConfig);
  return bffChannels
    .filter((ch) => {
      return channelFilterFn(ch, marshalConfig);
    })
    .map((channel) => {
      return bffChannelToPublic(
        channel,
        channelsByGroupId,
        groupsByGroupId,
        marshalConfig,
      );
    });
}

/**
 * Make a mapping of group ID to group.
 */
function makeGroupsByGroupId(
  bffChannelGroups: BffChannelUiGroup[],
): Record<string, BffChannelUiGroup> {
  const groupMap: Record<string, BffChannelUiGroup> = {};
  for (const bffGroup of bffChannelGroups) {
    groupMap[bffGroup.id] = bffGroup;
  }
  return groupMap;
}

/**
 * Return true if the channel passes the filter criteria.
 */
function channelFilterFn(
  channel: BffChannel,
  marshalConfig: ChannelMarshalConfig,
) {
  if (marshalConfig.pairChannels.paired[channel.channel_code]) {
    // channel is a second member of a pair, skip
    return false;
  }

  if (marshalConfig.options.filterMinMax) {
    if (!satisfiesMinMax(marshalConfig.session, channel)) {
      // min/max amount not satisfied
      return false;
    }
  }

  const codes = Array.isArray(channel.channel_code)
    ? channel.channel_code
    : [channel.channel_code];
  const filter = marshalConfig.options.filter;
  if (
    filter &&
    codes.every((code) => !channelCodeMatchesFilter(filter, code))
  ) {
    // channel code does not match filter
    return false;
  }

  return true;
}

/**
 * Checks a channel code string against a filter term.
 */
function channelCodeMatchesFilter(
  filter: string | string[] | RegExp,
  code: string,
) {
  if (typeof filter === "string" && code === filter) {
    return true;
  }
  if (Array.isArray(filter) && filter.includes(code)) {
    return true;
  }
  if (filter instanceof RegExp && filter.test(code)) {
    return true;
  }
  return false;
}

/**
 * Create a mapping of group ID to channels in that group, applying channel filtering and removing empty groups.
 */
function makeChannelsByGroupId(
  bffChannels: BffChannel[],
  marshalConfig: ChannelMarshalConfig,
): Record<string, BffChannel[]> {
  const channelsByGroupId: Record<string, BffChannel[]> = {};
  for (const bffChannel of bffChannels) {
    if (!channelFilterFn(bffChannel, marshalConfig)) {
      continue;
    }
    const groupId = bffChannel.ui_group;
    if (!channelsByGroupId[groupId]) {
      channelsByGroupId[groupId] = [];
    }
    channelsByGroupId[groupId].push(bffChannel);
  }
  return channelsByGroupId;
}

type PairChannelData = {
  /** Map of channel_code of first member of pair to an array containing the pair */
  pairs: Record<string, [BffChannel, BffChannel]>;
  /** Set of channel_codes of second members of pairs */
  paired: Record<string, boolean>;
};

/**
 * Finds channels that are pairs (i.e., differ only by allow_save) and groups them together.
 */
export function findChannelPairs(bffChannels: BffChannel[]): PairChannelData {
  const brandMap = new Map<string, BffChannel[]>();
  for (const channel of bffChannels) {
    const brandName = channel.brand_name;
    if (!brandMap.has(brandName)) {
      brandMap.set(brandName, []);
    }
    brandMap.get(brandName)!.push(channel);
  }

  const pairs: Record<string, [BffChannel, BffChannel]> = {};
  const paired: Record<string, boolean> = {};
  for (const [_, channels] of brandMap) {
    for (const ch of channels) {
      const isFirst = channels[0].allow_save === false;
      if (isFirst) {
        const pair = channels.find(
          (other) =>
            ch.channel_code !== other.channel_code &&
            ch.ui_group === other.ui_group &&
            other.allow_save === true,
        );
        if (pair) {
          pairs[ch.channel_code] = [ch, pair];
          paired[pair.channel_code] = true;
        }
      }
    }
  }

  return {
    pairs,
    paired,
  };
}
