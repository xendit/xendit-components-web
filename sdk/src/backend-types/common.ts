import { BffBusiness } from "./business";
import { BffChannel, BffChannelUiGroup } from "./channel";
import { BffCustomer } from "./customer";
import { BffPaymentRequest, BffPaymentToken } from "./payment-entity";
import { BffSession } from "./session";

export type BffSucceededChannel = {
  channel_code: string;
  logo_url: string;
};

export type BffErrorContent = {
  title: string;
  message_1: string;
  message_2?: string;
};

export type BffResponse = {
  business: BffBusiness;
  customer: BffCustomer;
  channels: BffChannel[];
  channel_ui_groups: BffChannelUiGroup[];
  session: BffSession;
};

export type BffPollResponse = {
  session: BffSession;
  payment_token?: BffPaymentToken;
  payment_request?: BffPaymentRequest;
  succeeded_channel?: BffSucceededChannel;
  error_content?: BffErrorContent;
};
