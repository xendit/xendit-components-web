import { createRef, FunctionComponent } from "preact";
import { useLayoutEffect } from "preact/hooks";
import { useChannels, useSdk, useSession } from "./session-provider";
import { BffChannel } from "../backend-types/channel";
import { XenditPaymentChannel } from "../public-data-types";

export const DigitalWalletGooglepay: FunctionComponent = (props) => {
  const sdk = useSdk();
  const session = useSession();
  const channels = useChannels();

  const containerRef = createRef<HTMLDivElement>();

  useLayoutEffect(() => {
    const PaymentsClient = window.google?.payments?.api?.PaymentsClient; // Ensure PaymentsClient is referenced
    if (!PaymentsClient) {
      console.error(
        "XenditComponents: Google Pay button was requested but the Google Pay SDK is not loaded.",
      );
      return;
    }
    const paymentsClient = new PaymentsClient({ environment: "TEST" });
    const button = paymentsClient.createButton({
      buttonType: "pay",
      buttonLocale: session.locale,
      buttonSizeMode: "fill",
      onClick: () => {
        const tempGooglePayConfig: google.payments.api.PaymentDataRequest = {
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: mapChannelsToGooglePayMethods(channels),
          merchantInfo: {
            merchantId: "12345678901234567890",
            merchantName: "Demo Merchant",
          },
          transactionInfo: {
            transactionId: session.payment_session_id,
            totalPriceStatus: "FINAL",
            totalPrice: String(session.amount),
            currencyCode: session.currency,
          },
        };
        const paymentDataPromise =
          paymentsClient.loadPaymentData(tempGooglePayConfig);
        paymentDataPromise
          .then(function (paymentData) {
            // Handle the response
            console.log("Payment Data:", paymentData);
            const allChannels = sdk.getActiveChannels();
            const targetChannel = findGooglePayChannel(
              allChannels,
              paymentData,
            );
            sdk.submitDigitalWallet("GOOGLE_PAY", targetChannel, {
              google_pay_token:
                paymentData.paymentMethodData.tokenizationData.token,
            });
          })
          .catch(function (err) {
            // Handle errors
            console.error("Error loading payment data:", err);
          });
      },
    });
    if (containerRef.current) {
      containerRef.current.appendChild(button);
    }
  });

  return <div ref={containerRef}></div>;
};

function mapChannelsToGooglePayMethods(
  channels: BffChannel[],
): google.payments.api.PaymentMethodSpecification[] {
  const allowedChannels = ["CARDS"];

  const digitalWalletEnabledChannels = channels.filter((channel) =>
    allowedChannels.includes(channel.channel_code),
  );

  return digitalWalletEnabledChannels
    .map<google.payments.api.PaymentMethodSpecification | null>((channel) => {
      if (channel.channel_code === "CARDS" && channel.card) {
        return {
          type: "CARD",
          parameters: {
            allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
            allowedCardNetworks: channel.card.brands
              .map((brand) => cardNetworkToGooglePayNetwork(brand.name))
              .filter(
                (network): network is google.payments.api.CardNetwork =>
                  !!network,
              ),
          },
          tokenizationSpecification: {
            type: "PAYMENT_GATEWAY",
            parameters: {
              gateway: "example",
              gatewayMerchantId: "exampleGatewayMerchantId",
            },
          },
        };
      }

      // TODO: add support for any future channels googlepay may support

      return null;
    })
    .filter((method) => method !== null);
}

function cardNetworkToGooglePayNetwork(
  cardNetwork: string,
): google.payments.api.CardNetwork | null {
  switch (cardNetwork) {
    case "VISA":
      return "VISA";
    case "MASTERCARD":
      return "MASTERCARD";
    case "AMEX":
      return "AMEX";
    case "DISCOVER":
      return "DISCOVER";
    case "JCB":
      return "JCB";
    default:
      return null;
  }
}

function findGooglePayChannel(
  allChannels: XenditPaymentChannel[],
  paymentData: google.payments.api.PaymentData,
): XenditPaymentChannel {
  switch (paymentData.paymentMethodData.type) {
    case "CARD": {
      const cards = allChannels.find((channel) => {
        if (Array.isArray(channel.channelCode)) {
          return channel.channelCode.includes("CARDS");
        }
        return channel.channelCode === "CARDS";
      });
      if (!cards) {
        throw new Error("Expected to find cards channel");
      }
      return cards;
    }
    default: {
      throw new Error("Unexpected response from googlepay");
    }
  }
}
