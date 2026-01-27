import { WorldState, XenditComponents } from "../public-sdk";
import { BffSession } from "../backend-types/session";
import { BffBusiness } from "../backend-types/business";
import { BffCustomer } from "../backend-types/customer";
import { BffChannel, BffChannelUiGroup } from "../backend-types/channel";
import { internal } from "../internal";
import { BffCardDetails } from "../backend-types/card-details";
import { ComponentChildren, createContext, FunctionComponent } from "preact";
import { useContext } from "preact/hooks";

// Create contexts
export const SessionContext = createContext<BffSession | null>(null);
SessionContext.displayName = "SessionContext";

export const BusinessContext = createContext<BffBusiness | null>(null);
BusinessContext.displayName = "BusinessContext";

export const CustomerContext = createContext<BffCustomer | null>(null);
CustomerContext.displayName = "CustomerContext";

export const ChannelsContext = createContext<BffChannel[] | null>(null);
ChannelsContext.displayName = "ChannelsContext";

export const ChannelUiGroupsContext = createContext<BffChannelUiGroup[] | null>(
  null,
);
ChannelUiGroupsContext.displayName = "ChannelUiGroupsContext";

export const CardDetailsContext = createContext<{
  cardNumber: string | null;
  details: BffCardDetails | null;
}>({ cardNumber: null, details: null });
CardDetailsContext.displayName = "CardDetailsContext";

export const SdkContext = createContext<XenditComponents | null>(null);
SdkContext.displayName = "SdkContext";

export const CurrentChannelContext = createContext<BffChannel | null>(null);
CurrentChannelContext.displayName = "CurrentChannelContext";

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

export const useCurrentChannel = () => {
  return useContext(CurrentChannelContext);
};

interface XenditSessionProviderProps {
  children: ComponentChildren;
  data: WorldState;
  sdk: XenditComponents;
}

export const XenditSessionProvider: FunctionComponent<
  XenditSessionProviderProps
> = ({ children, data, sdk }) => {
  const { session, business, customer, channels, channelUiGroups } = data;

  const channel = sdk.getCurrentChannel()?.[internal]?.[0] ?? null;

  return (
    <SdkContext.Provider value={sdk}>
      <CurrentChannelContext.Provider value={channel}>
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
      </CurrentChannelContext.Provider>
    </SdkContext.Provider>
  );
};
