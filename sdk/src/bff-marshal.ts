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
  bffChannelGroups: BffChannelUiGroup[],
): XenditPaymentChannelGroup[] {
  const groupsByGroupId = makeGroupsByGroupId(bffChannelGroups);
  const channelsByGroupId = makeChannelsByGroupId(bffChannels);
  return bffChannelGroups.map((group) => {
    return bffUiGroupToPublic(group, channelsByGroupId, groupsByGroupId);
  });
}

export function bffUiGroupToPublic(
  bffChannelGroup: BffChannelUiGroup,
  channelsByGroupId: Record<string, BffChannel[]>,
  groupsByGroupId: Record<string, BffChannelUiGroup>,
) {
  return removeUndefinedPropertiesFromObject<XenditPaymentChannelGroup>({
    groupId: bffChannelGroup.id,
    label: bffChannelGroup.label,
    get channels() {
      return (channelsByGroupId[bffChannelGroup.id] || []).map((channel) => {
        return bffChannelToPublic(channel, channelsByGroupId, groupsByGroupId);
      });
    },
    [internal]: bffChannelGroup,
  });
}

export function singleBffChannelToPublic(
  bffChannel: BffChannel,
): XenditPaymentChannel {
  return bffChannelToPublic(bffChannel, {}, {});
}

export function bffChannelToPublic(
  bffChannel: BffChannel,
  bffChannelsByGroupId: Record<string, BffChannel[]>,
  bffGroupsByGroupId: Record<string, BffChannelUiGroup>,
): XenditPaymentChannel {
  return removeUndefinedPropertiesFromObject<XenditPaymentChannel>({
    channelCode: bffChannel.channel_code,
    brandName: bffChannel.brand_name,
    brandColor: bffChannel.brand_color,
    brandLogoUrl: bffChannel.brand_logo_url,
    get uiGroup() {
      return bffUiGroupToPublic(
        bffGroupsByGroupId[bffChannel.ui_group],
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
    [internal]: bffChannel,
  });
}

export function bffChannelsToPublic(
  bffChannels: BffChannel[],
  bffChannelGroups: BffChannelUiGroup[],
): XenditPaymentChannel[] {
  const groupsByGroupId = makeGroupsByGroupId(bffChannelGroups);
  const channelsByGroupId = makeChannelsByGroupId(bffChannels);
  return bffChannels.map((channel) => {
    return bffChannelToPublic(channel, channelsByGroupId, groupsByGroupId);
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
): Record<string, BffChannel[]> {
  const channelsByGroupId: Record<string, BffChannel[]> = {};
  for (const bffChannel of bffChannels) {
    const groupId = bffChannel.ui_group;
    if (!channelsByGroupId[groupId]) {
      channelsByGroupId[groupId] = [];
    }
    channelsByGroupId[groupId].push(bffChannel);
  }
  return channelsByGroupId;
}
