import { BffPaymentMethod, BffResponse, BffSession } from "./bff-types";

export function bffSessionToPublicSession(bffSession: BffSession) {
  return {
    amount: bffSession.amount,
    businessId: bffSession.business_id,
    cancelReturnUrl: bffSession.cancel_return_url,
    captureMethod: bffSession.capture_method,
    country: bffSession.country,
    created: bffSession.created,
    currency: bffSession.currency,
    customerId: bffSession.customer_id,
    description: bffSession.description,
    expiresAt: bffSession.expires_at,
    locale: bffSession.locale,
    mode: bffSession.mode,
    paymentLinkUrl: bffSession.payment_link_url,
    paymentSessionId: bffSession.payment_session_id,
    referenceId: bffSession.reference_id,
    sessionType: bffSession.session_type,
    status: bffSession.status,
    successReturnUrl: bffSession.success_return_url,
    updated: bffSession.updated
  };
}

export function bffChannelsToPublicChannelGroups(bffResponse: BffResponse) {
  return [];
}

export function bffChannelsToPublicChannels(bffChannels: BffPaymentMethod[]) {
  return bffChannels.map((channel) => ({
    channelCode: channel.channel_code,
    logoUrl: channel.logo_url,
    pmType: channel.pm_type
  }));
}
