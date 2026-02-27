import { FunctionComponent } from "preact";
import { useCallback, useLayoutEffect, useMemo, useRef } from "preact/hooks";
import {
  useBusiness,
  useDigitalWallets,
  useSdk,
  useSession,
} from "./session-provider";
import { ChannelProperties } from "../backend-types/channel";
import { XenditPaymentChannel } from "../public-data-types";
import { assert } from "../utils";
import { DigitalWalletOptions } from "../public-options-types";

type Props = {
  options?: DigitalWalletOptions<"GOOGLE_PAY">;
  onReady: () => void;
};

export const DigitalWalletGooglepay: FunctionComponent<Props> = (props) => {
  const { onReady, options } = props;

  const sdk = useSdk();
  const t = sdk.t;

  const session = useSession();
  const business = useBusiness();
  const digitalWallets = useDigitalWallets();
  const digitalWalletsGooglePay = digitalWallets.google_pay;
  assert(digitalWalletsGooglePay);

  const didCallReady = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const paymentsClient = useRef<google.payments.api.PaymentsClient | null>(
    null,
  );

  const googlePayChannels = useMemo(() => {
    return digitalWalletsGooglePay.allowed_payment_methods.map(
      (obj) => obj.payment_method_specification,
    );
  }, [digitalWalletsGooglePay.allowed_payment_methods]);

  const googlePayConfig: google.payments.api.PaymentDataRequest = useMemo(
    () => ({
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: googlePayChannels,
      emailRequired: true,
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
      buttonType: "plain",
      buttonRadius: 999,
      buttonSizeMode: "fill",
      buttonBorderType: "no_border",
      ...options,
    }),
    [options],
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

        let targetChannel: XenditPaymentChannel | null = null;
        for (const googlePayChannel of digitalWalletsGooglePay.allowed_payment_methods) {
          if (
            googlePayChannel.payment_method_specification.type ===
            paymentData.paymentMethodData.type
          ) {
            targetChannel = findChannel(
              allChannels,
              googlePayChannel.channel_code,
            );
          }
        }
        assert(targetChannel);

        let channelProperties: ChannelProperties = {};
        if (targetChannel.channelCode === "CARDS") {
          channelProperties = {
            google_pay: JSON.stringify(paymentData),
          };
        }

        sdk.submitDigitalWallet("GOOGLE_PAY", targetChannel, channelProperties);
      })
      .catch(function (err) {
        type GooglePayErrorCode =
          | "CANCELED"
          | "DEVELOPER_ERROR"
          | "BUYER_ACCOUNT_ERROR"
          | "MERCHANT_ACCOUNT_ERROR"
          | "INTERNAL_ERROR";
        const statusCode = err.statusCode as string as GooglePayErrorCode;

        if (statusCode === "CANCELED") {
          return;
        }

        function localeKeyForGooglePayError<
          T extends GooglePayErrorCode,
          U extends "title" | "message",
        >(errorCode: T, suffix: U) {
          return `google_pay_errors.${errorCode.toLowerCase() as Lowercase<T>}.${suffix}` as const;
        }

        const submissionError = {
          code: `GOOGLE_PAY_${statusCode}` as const,
          text: [
            t(
              localeKeyForGooglePayError(statusCode, "title"),
              t("google_pay_errors.unknown_error.title"),
            ),
            t(
              localeKeyForGooglePayError(statusCode, "message"),
              t("google_pay_errors.unknown_error.message", { statusCode }),
            ),
          ],
        };

        sdk.submitDigitalWallet(
          "GOOGLE_PAY",
          sdk.getActiveChannels()[0],
          {},
          submissionError,
        );
      });
  }, [
    digitalWalletsGooglePay.allowed_payment_methods,
    googlePayConfig,
    sdk,
    t,
  ]);

  // call onready if the googlepay sdk is ready
  useLayoutEffect(() => {
    if (!paymentsClient.current) {
      return;
    }
    if (didCallReady.current) {
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

        if (didCallReady.current) return;
        didCallReady.current = true;
        onReady();
      });
  }, [googlePayChannels, onReady]);

  // create the button
  useLayoutEffect(() => {
    if (!paymentsClient.current) {
      return;
    }

    const button = paymentsClient.current.createButton({
      ...buttonConfigWithDefaults,
      buttonLocale: session.locale,
      allowedPaymentMethods: googlePayChannels,
      onClick,
    });
    if (containerRef.current) {
      containerRef.current.replaceChildren(button);
    }
  }, [buttonConfigWithDefaults, googlePayChannels, onClick, session.locale]);

  return <div ref={containerRef}></div>;
};

function findChannel(
  allChannels: XenditPaymentChannel[],
  targetChannelCode: string,
): XenditPaymentChannel {
  const ch = allChannels.find((channel) => {
    if (Array.isArray(channel.channelCode)) {
      return channel.channelCode.includes(targetChannelCode);
    }
    return channel.channelCode === targetChannelCode;
  });
  if (!ch) {
    throw new Error(`Channel not found for code: ${targetChannelCode}`);
  }
  return ch;
}
