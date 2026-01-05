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
} from "./utils";

type XenditItem = NonNullable<XenditSession["items"]>[number];

export function bffSessionToPublic(bffSession: BffSession): XenditSession {
  assertNotEquals(bffSession.session_type, "AUTHORIZATION");
  assertEquals(bffSession.mode, "COMPONENT");

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
    referenceId: bffCustomer.reference_id ?? undefined,
    email: bffCustomer.email ?? undefined,
    mobileNumber: bffCustomer.mobile_number ?? undefined,
    individualDetail: {
      givenNames: bffCustomer.individual_detail.given_names ?? undefined,
      surname: bffCustomer.individual_detail.surname ?? undefined,
      // TODO: add optional fields here
    },
  };
}

export function bffUiGroupsToPublic(
  bffChannels: BffChannel[],
  channelPairData: PairChannelData,
  bffChannelGroups: BffChannelUiGroup[],
): XenditPaymentChannelGroup[] {
  const groupsByGroupId = makeGroupsByGroupId(bffChannelGroups);
  const channelsByGroupId = makeChannelsByGroupId(bffChannels, channelPairData);
  return bffChannelGroups.map((group) => {
    return bffUiGroupToPublic(
      group,
      channelPairData,
      channelsByGroupId,
      groupsByGroupId,
    );
  });
}

export function bffUiGroupToPublic(
  bffChannelGroup: BffChannelUiGroup,
  channelPairData: PairChannelData,
  channelsByGroupId: Record<string, BffChannel[]>,
  groupsByGroupId: Record<string, BffChannelUiGroup>,
) {
  return removeUndefinedPropertiesFromObject<XenditPaymentChannelGroup>({
    groupId: bffChannelGroup.id,
    label: bffChannelGroup.label,
    get channels() {
      return (channelsByGroupId[bffChannelGroup.id] || []).map((channel) => {
        return bffChannelToPublic(
          channel,
          channelPairData,
          channelsByGroupId,
          groupsByGroupId,
        );
      });
    },
    [internal]: bffChannelGroup,
  });
}

export function singleBffChannelToPublic(
  bffChannel: BffChannel,
  pairChannelData: PairChannelData,
): XenditPaymentChannel {
  return bffChannelToPublic(bffChannel, pairChannelData, {}, {});
}

export function bffChannelToPublic(
  bffChannel: BffChannel,
  pairChannelData: PairChannelData,
  bffChannelsByGroupId: Record<string, BffChannel[]>,
  bffGroupsByGroupId: Record<string, BffChannelUiGroup>,
): XenditPaymentChannel {
  assert(!pairChannelData.paired[bffChannel.channel_code]);

  return removeUndefinedPropertiesFromObject<XenditPaymentChannel>({
    channelCode:
      pairChannelData.pairs[bffChannel.channel_code]?.map(
        (ch) => ch.channel_code,
      ) ?? bffChannel.channel_code,
    brandName: bffChannel.brand_name,
    brandColor: bffChannel.brand_color,
    brandLogoUrl: bffChannel.brand_logo_url,
    get uiGroup() {
      return bffUiGroupToPublic(
        bffGroupsByGroupId[bffChannel.ui_group],
        pairChannelData,
        bffChannelsByGroupId,
        bffGroupsByGroupId,
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
    [internal]: pairChannelData.pairs[bffChannel.channel_code] ?? [bffChannel],
  });
}

export function bffChannelsToPublic(
  bffChannels: BffChannel[],
  pairChannelData: PairChannelData,
  bffChannelGroups: BffChannelUiGroup[],
): XenditPaymentChannel[] {
  const groupsByGroupId = makeGroupsByGroupId(bffChannelGroups);
  const channelsByGroupId = makeChannelsByGroupId(bffChannels, pairChannelData);
  return bffChannels
    .filter((ch) => !pairChannelData.paired[ch.channel_code])
    .map((channel) => {
      return bffChannelToPublic(
        channel,
        pairChannelData,
        channelsByGroupId,
        groupsByGroupId,
      );
    });
}

function makeGroupsByGroupId(
  bffChannelGroups: BffChannelUiGroup[],
): Record<string, BffChannelUiGroup> {
  const groupMap: Record<string, BffChannelUiGroup> = {};
  for (const bffGroup of bffChannelGroups) {
    groupMap[bffGroup.id] = bffGroup;
  }
  return groupMap;
}

function makeChannelsByGroupId(
  bffChannels: BffChannel[],
  pairChannelData: PairChannelData,
): Record<string, BffChannel[]> {
  const channelsByGroupId: Record<string, BffChannel[]> = {};
  for (const bffChannel of bffChannels) {
    if (pairChannelData.paired[bffChannel.channel_code]) {
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
