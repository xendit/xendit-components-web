import { FunctionComponent } from "preact";
import { useCallback, useLayoutEffect, useMemo, useRef } from "preact/hooks";
import {
  useBusiness,
  useChannels,
  useSdk,
  useSession,
} from "./session-provider";
import { BffChannel } from "../backend-types/channel";
import { XenditPaymentChannel } from "../public-data-types";
import { assert } from "../utils";

type Props = {
  buttonOptions?: {
    buttonColor?: "default" | "black" | "white";
    buttonType?:
      | "pay"
      | "book"
      | "buy"
      | "checkout"
      | "order"
      | "plain"
      | "long"
      | "short";
    buttonRadius?: number;
    buttonSizeMode?: "fill" | "static";
    buttonBorderType?: "no_border" | "default_border";
  };
};

export const DigitalWalletGooglepay: FunctionComponent<Props> = (props) => {
  const sdk = useSdk();
  const t = sdk.t;

  const session = useSession();
  const channels = useChannels();
  const business = useBusiness();

  const containerRef = useRef<HTMLDivElement>(null);

  const paymentsClient = useRef<google.payments.api.PaymentsClient | null>(
    null,
  );

  const googlePayChannels = useMemo(
    () => mapChannelsToGooglePayMethods(channels),
    [channels],
  );

  const googlePayConfig: google.payments.api.PaymentDataRequest = useMemo(
    () => ({
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: googlePayChannels,
      merchantInfo: {
        merchantId: "12345678901234567890",
        merchantName: business.name ?? "",
      },
      transactionInfo: {
        transactionId: session.payment_session_id,
        totalPriceStatus: "FINAL",
        totalPrice: String(session.amount),
        currencyCode: session.currency,
      },
    }),
    [
      business.name,
      googlePayChannels,
      session.amount,
      session.currency,
      session.payment_session_id,
    ],
  );

  const buttonConfigWithDefaults: Omit<
    google.payments.api.ButtonOptions,
    "onClick"
  > = useMemo(
    () => ({
      buttonColor: "default",
      buttonType: "pay",
      buttonRadius: 999,
      buttonSizeMode: "fill",
      buttonBorderType: "no_border",
      ...props.buttonOptions,
    }),
    [props.buttonOptions],
  );

  useLayoutEffect(() => {
    const PaymentsClient = window.google?.payments?.api?.PaymentsClient;
    if (!PaymentsClient) {
      console.error(
        "XenditComponents: Google Pay button was requested but the Google Pay SDK is not loaded.",
      );
      return;
    }
    paymentsClient.current = new PaymentsClient({ environment: "TEST" });
  }, []);

  const onClick = useCallback(() => {
    assert(paymentsClient.current);

    paymentsClient.current
      .loadPaymentData(googlePayConfig)
      .then(function (paymentData) {
        // Handle the response
        const allChannels = sdk.getActiveChannels();
        const targetChannel = findGooglePayChannel(allChannels, paymentData);
        const channelProperties = {
          google_pay_token:
            paymentData.paymentMethodData.tokenizationData.token,
        };
        sdk.submitDigitalWallet("GOOGLE_PAY", targetChannel, channelProperties);
      })
      .catch(function (err) {
        let errorText;
        switch (err.statusCode) {
          case "CANCELED": {
            break;
          }
          case "DEVELOPER_ERROR": {
            errorText = [
              t("google_pay_errors.developer_error.title"),
              t("google_pay_errors.developer_error.message"),
            ];
            break;
          }
          case "BUYER_ACCOUNT_ERROR": {
            errorText = [
              t("google_pay_errors.buyer_account_error.title"),
              t("google_pay_errors.buyer_account_error.message"),
            ];
            break;
          }
          case "MERCHANT_ACCOUNT_ERROR": {
            errorText = [
              t("google_pay_errors.merchant_account_error.title"),
              t("google_pay_errors.merchant_account_error.message"),
            ];
            break;
          }
          case "INTERNAL_ERROR":
          default: {
            errorText = [
              t("google_pay_errors.internal_error.title"),
              t("google_pay_errors.internal_error.message"),
            ];
            break;
          }
        }

        if (errorText) {
          sdk.submitDigitalWallet(
            "GOOGLE_PAY",
            sdk.getActiveChannels()[0],
            {},
            {
              code: `GOOGLE_PAY_${err.statusCode}`,
              text: errorText,
            },
          );
        }
      });
  }, [googlePayConfig, sdk, t]);

  useLayoutEffect(() => {
    if (!paymentsClient.current) {
      return;
    }

    paymentsClient.current
      .isReadyToPay({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: googlePayChannels,
      })
      .then(function (response) {
        if (!response.result) {
          return;
        }
        assert(paymentsClient.current);

        const button = paymentsClient.current.createButton({
          ...buttonConfigWithDefaults,
          buttonLocale: session.locale,
          allowedPaymentMethods: googlePayChannels,
          onClick,
        });
        if (containerRef.current) {
          containerRef.current.appendChild(button);
        }
      });
  }, [
    buttonConfigWithDefaults,
    channels,
    googlePayChannels,
    onClick,
    sdk,
    session.locale,
  ]);

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
