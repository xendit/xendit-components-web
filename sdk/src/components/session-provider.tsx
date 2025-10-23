import React, { createContext, useContext, ReactNode } from "react";
import { XenditSessionSdk } from "../public-sdk";
import { BffSession } from "../backend-types/session";
import { BffBusiness } from "../backend-types/business";
import { BffCustomer } from "../backend-types/customer";
import { BffChannel, BffChannelUiGroup } from "../backend-types/channel";
import { BffResponse } from "../backend-types/common";

// Create contexts
const SessionContext = createContext<BffSession | undefined>(undefined);
SessionContext.displayName = "SessionContext";

const BusinessContext = createContext<BffBusiness | undefined>(undefined);
BusinessContext.displayName = "BusinessContext";

const CustomerContext = createContext<BffCustomer | undefined>(undefined);
CustomerContext.displayName = "CustomerContext";

const ChannelsContext = createContext<BffChannel[] | undefined>(undefined);
ChannelsContext.displayName = "ChannelsContext";

const ChannelUiGroupsContext = createContext<BffChannelUiGroup[] | undefined>(
  undefined,
);
ChannelUiGroupsContext.displayName = "ChannelUiGroupsContext";

const SdkContext = createContext<XenditSessionSdk | undefined>(undefined);
SdkContext.displayName = "SdkContext";

// Custom hooks for consuming contexts
export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a XenditSessionProvider");
  }
  return context;
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error("useBusiness must be used within a XenditSessionProvider");
  }
  return context;
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error("useCustomer must be used within a XenditSessionProvider");
  }
  return context;
};

export const useChannels = () => {
  const context = useContext(ChannelsContext);
  if (context === undefined) {
    throw new Error("useChannels must be used within a XenditSessionProvider");
  }
  return context;
};

export const useChannelUiGroups = () => {
  const context = useContext(ChannelUiGroupsContext);
  if (context === undefined) {
    throw new Error(
      "useChannelUiGroups must be used within a XenditSessionProvider",
    );
  }
  return context;
};

export const useSdk = () => {
  const context = useContext(SdkContext);
  if (context === undefined) {
    throw new Error("useSdk must be used within a XenditSessionProvider");
  }
  return context;
};

interface XenditSessionProviderProps {
  children: ReactNode;
  data: BffResponse;
  sdk: XenditSessionSdk;
}

export const XenditSessionProvider: React.FC<XenditSessionProviderProps> = ({
  children,
  data,
  sdk,
}) => {
  const {
    session,
    business,
    customer,
    channels,
    channel_ui_groups: channelUiGroups,
  } = data;

  return (
    <SdkContext.Provider value={sdk}>
      <SessionContext.Provider value={session}>
        <BusinessContext.Provider value={business}>
          <CustomerContext.Provider value={customer}>
            <ChannelsContext.Provider value={channels}>
              <ChannelUiGroupsContext.Provider value={channelUiGroups}>
                {children}
              </ChannelUiGroupsContext.Provider>
            </ChannelsContext.Provider>
          </CustomerContext.Provider>
        </BusinessContext.Provider>
      </SessionContext.Provider>
    </SdkContext.Provider>
  );
};
