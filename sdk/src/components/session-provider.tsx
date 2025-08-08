import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  BffBusiness,
  BffChannelUiGroup,
  BffCustomer,
  BffResponse,
  BffSession
} from "../bff-types";
import { Channel } from "../forms-types";
import { XenditSessionSdk } from "../public-sdk";

// Create contexts
const SessionContext = createContext<BffSession | undefined>(undefined);
const BusinessContext = createContext<BffBusiness | undefined>(undefined);
const CustomerContext = createContext<BffCustomer | undefined>(undefined);
const ChannelsContext = createContext<Channel[] | undefined>(undefined);
const ChannelUiGroupsContext = createContext<BffChannelUiGroup[] | undefined>(
  undefined
);
const SdkContext = createContext<XenditSessionSdk | undefined>(undefined);

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
      "useChannelUiGroups must be used within a XenditSessionProvider"
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
  sdk
}) => {
  const {
    session,
    business,
    customer,
    channels,
    channel_ui_groups: channelUiGroups
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
