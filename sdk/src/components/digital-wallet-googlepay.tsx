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
        merchantId: digitalWalletsGooglePay.merchant_id,
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
      digitalWalletsGooglePay.merchant_id,
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

    // return the channel corresponding to the selected payment method in google pay
    function findTargetChannel(paymentData: google.payments.api.PaymentData) {
      assert(digitalWalletsGooglePay);

      const allChannels = sdk.getActiveChannels();
      for (const googlePayChannel of digitalWalletsGooglePay.allowed_payment_methods) {
        if (
          googlePayChannel.payment_method_specification.type ===
          paymentData.paymentMethodData.type
        ) {
          return findChannel(allChannels, googlePayChannel.channel_code);
        }
      }

      throw new Error(
        `No matching channel found for selected Google Pay payment method ${paymentData.paymentMethodData.type}`,
      );
    }

    paymentsClient.current
      .loadPaymentData(googlePayConfig)
      .then(function (paymentData) {
        const targetChannel = findTargetChannel(paymentData);
        assert(targetChannel);

        let channelProperties: ChannelProperties = {};
        if (targetChannel.channelCode === "CARDS") {
          // for cards, pass the whole paymentData to backend in channel properties
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
        const statusCode = err.statusCode as GooglePayErrorCode;

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

        // there is no target channel on errors, pick the channel used for the first allowed payment method
        const firstGooglePayChannel =
          digitalWalletsGooglePay.allowed_payment_methods[0];
        const targetChannel = findChannel(
          sdk.getActiveChannels(),
          firstGooglePayChannel.channel_code,
        );

        // submit and force an error
        sdk.submitDigitalWallet(
          "GOOGLE_PAY",
          targetChannel,
          {},
          submissionError,
        );
      });
  }, [digitalWalletsGooglePay, googlePayConfig, sdk, t]);

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
