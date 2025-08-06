import {
  BffBusiness,
  BffChannel,
  BffChannelUiGroup,
  BffCustomer,
  BffResponse,
  BffSession
} from "../bff-types";
import { createContext, provideContext } from "../context";

export const SessionContext = createContext<BffSession>(Symbol("session"));
export const BusinessContext = createContext<BffBusiness>(Symbol("business"));
export const CustomerContext = createContext<BffCustomer>(Symbol("customer"));
export const ChannelsContext = createContext<BffChannel[]>(Symbol("channels"));
export const ChannelUiGroupsContext = createContext<BffChannelUiGroup[]>(
  Symbol("channel-ui-groups")
);

export class XenditSessionContextProvider extends HTMLElement {
  static tag = "xendit-session-context-provider" as const;

  private providers = {
    session: provideContext(this, SessionContext),
    business: provideContext(this, BusinessContext),
    customer: provideContext(this, CustomerContext),
    channels: provideContext(this, ChannelsContext),
    channelUiGroups: provideContext(this, ChannelUiGroupsContext)
  };

  constructor() {
    super();
  }

  setContextData(data: BffResponse) {
    this.providers.session.set(data.session);
    this.providers.business.set(data.business);
    this.providers.customer.set(data.customer);
    this.providers.channels.set(data.payment_methods);
    this.providers.channelUiGroups.set(data.payment_methods_groups);
  }
}
