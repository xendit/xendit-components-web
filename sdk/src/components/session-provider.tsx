import React, { createContext, useContext, ReactNode } from "react";
import { WorldState, XenditSessionSdk } from "../public-sdk";
import { BffSession } from "../backend-types/session";
import { BffBusiness } from "../backend-types/business";
import { BffCustomer } from "../backend-types/customer";
import {
  BffChannel,
  BffChannelUiGroup,
  ChannelProperties,
} from "../backend-types/channel";
import { internal } from "../internal";
import { BffCardDetails } from "../backend-types/card-details";

// Create contexts
const SessionContext = createContext<BffSession | null>(null);
SessionContext.displayName = "SessionContext";

const BusinessContext = createContext<BffBusiness | null>(null);
BusinessContext.displayName = "BusinessContext";

const CustomerContext = createContext<BffCustomer | null>(null);
CustomerContext.displayName = "CustomerContext";

const ChannelsContext = createContext<BffChannel[] | null>(null);
ChannelsContext.displayName = "ChannelsContext";

const ChannelUiGroupsContext = createContext<BffChannelUiGroup[] | null>(null);
ChannelUiGroupsContext.displayName = "ChannelUiGroupsContext";

const CardDetailsContext = createContext<{
  cardNumber: string | null;
  details: BffCardDetails | null;
}>({ cardNumber: null, details: null });
CardDetailsContext.displayName = "CardDetailsContext";

const SdkContext = createContext<XenditSessionSdk | null>(null);
SdkContext.displayName = "SdkContext";

const ActiveChannelContext = createContext<{
  channel: BffChannel | null;
  channelProperties: ChannelProperties | null;
}>({
  channel: null,
  channelProperties: null,
});
ActiveChannelContext.displayName = "ActiveChannelContext";

// Custom hooks for consuming contexts
export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === null) {
    throw new Error("useSession must be used within a XenditSessionProvider");
  }
  return context;
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (context === null) {
    throw new Error("useBusiness must be used within a XenditSessionProvider");
  }
  return context;
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === null) {
    throw new Error("useCustomer must be used within a XenditSessionProvider");
  }
  return context;
};

export const useChannels = () => {
  const context = useContext(ChannelsContext);
  if (context === null) {
    throw new Error("useChannels must be used within a XenditSessionProvider");
  }
  return context;
};

export const useChannelUiGroups = () => {
  const context = useContext(ChannelUiGroupsContext);
  if (context === null) {
    throw new Error(
      "useChannelUiGroups must be used within a XenditSessionProvider",
    );
  }
  return context;
};

export const useCardDetails = () => {
  const context = useContext(CardDetailsContext);
  return context;
};

export const useSdk = () => {
  const context = useContext(SdkContext);
  if (context === null) {
    throw new Error("useSdk must be used within a XenditSessionProvider");
  }
  return context;
};

export const useActiveChannel = () => {
  return useContext(ActiveChannelContext);
};

interface XenditSessionProviderProps {
  children: ReactNode;
  data: WorldState;
  sdk: XenditSessionSdk;
}

export const XenditSessionProvider: React.FC<XenditSessionProviderProps> = ({
  children,
  data,
  sdk,
}) => {
  const { session, business, customer, channels, channelUiGroups } = data;

  const channel = sdk.getActiveChannel()?.[internal] ?? null;
  const channelProperties =
    sdk[internal].liveComponents.paymentChannels.get(
      sdk.getActiveChannel()?.[internal]?.channel_code ?? "",
    )?.channelProperties ?? null;

  return (
    <SdkContext.Provider value={sdk}>
      <ActiveChannelContext.Provider
        value={{
          channel,
          channelProperties,
        }}
      >
        <SessionContext.Provider value={session}>
          <BusinessContext.Provider value={business}>
            <CustomerContext.Provider value={customer}>
              <ChannelsContext.Provider value={channels}>
                <ChannelUiGroupsContext.Provider value={channelUiGroups}>
                  <CardDetailsContext.Provider value={data.cardDetails}>
                    {children}
                  </CardDetailsContext.Provider>
                </ChannelUiGroupsContext.Provider>
              </ChannelsContext.Provider>
            </CustomerContext.Provider>
          </BusinessContext.Provider>
        </SessionContext.Provider>
      </ActiveChannelContext.Provider>
    </SdkContext.Provider>
  );
};
