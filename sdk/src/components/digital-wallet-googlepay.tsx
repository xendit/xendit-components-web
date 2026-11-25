import { FunctionComponent } from "preact";
import { useCallback, useLayoutEffect, useMemo, useRef } from "preact/hooks";
import {
  useBusiness,
  useChannels,
  useDigitalWallets,
  useSdk,
  useSession,
} from "./session-provider";
import { ChannelProperties } from "../backend-types/channel";
import { XenditPaymentChannel } from "../public-data-types";
import {
  assert,
  cancellableSleep,
  MOCK_NETWORK_DELAY_MS,
  satisfiesMinMax,
} from "../utils";
import { DigitalWalletOptions } from "../public-options-types";
import { getTelemetry } from "../telemetry";
import { TelemetryEvents } from "../telemetry-events";
import { TFunction } from "../localization";
import { XenditComponents } from "../public-sdk";
import { BffDigitalWallets } from "../backend-types/digital-wallets";
import { BffPollResponse } from "../backend-types/common";
import { googlepayCancel, googlepayGetConfig } from "../api";
import { makeMockGooglepayConfig } from "../data/test-data-modifiers";
import { internal } from "../internal";
import { BffSession } from "../backend-types/session";
import { BffBusiness } from "../backend-types/business";

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
  const channels = useChannels();
  const digitalWallets = useDigitalWallets();
  const digitalWalletsGooglePay = digitalWallets?.google_pay;
  assert(digitalWalletsGooglePay);

  const didCallReady = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const paymentsClient = useRef<google.payments.api.PaymentsClient | null>(
    null,
  );

  const allowedChannelCodes = useMemo(() => {
    return digitalWalletsGooglePay.allowed_payment_methods
      .filter((gpayMethod) => {
        const ch = channels.find(
          (c) => c.channel_code === gpayMethod.channel_code,
        );
        if (!ch) {
          throw new Error(
            "Channel found in Google Pay config not found in channels list",
          );
        }
        return satisfiesMinMax(session, ch);
      })
      .map((obj) => obj.channel_code);

    // assume the session min/max and channels list won't change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digitalWalletsGooglePay.allowed_payment_methods]);

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
    const isTestEnv = sdk.isMock() || sdk.isDevelopmentEnv();
    paymentsClient.current = new PaymentsClient({
      environment: isTestEnv ? "TEST" : "PRODUCTION",
    });
  }, [sdk]);

  const onClick = useCallback(async () => {
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

    let googlepayResult: GooglepayResult;
    try {
      // begin googlepay request
      googlepayResult = await googlepayAsync(
        sdk,
        session,
        business,
        paymentsClient.current,
        digitalWalletsGooglePay,
        allowedChannelCodes,
      );
    } catch {
      // error from xendit api not gpay
      googlepayResult = { type: "error", statusCode: "UNKNOWN_ERROR" };
    }

    switch (googlepayResult.type) {
      case "canceled":
        // do nothing
        return;

      case "error": {
        const statusCode = googlepayResult.statusCode;

        const submissionError = createGooglePaySubmissionError(statusCode, t);

        // there is no target channel on errors, pick the channel used for the first allowed payment method
        const firstGooglePayChannel =
          digitalWalletsGooglePay.allowed_payment_methods[0];
        assert(firstGooglePayChannel);
        const targetChannel = findChannel(
          sdk.getActiveChannels(),
          firstGooglePayChannel.channel_code,
        );

        // submit and force an error
        sdk.submitDigitalWallet(
          "GOOGLE_PAY",
          targetChannel,
          {},
          false, // no save
          submissionError, // forced error
          false, // regular flow
        );
        return;
      }

      case "success": {
        let targetChannel: XenditPaymentChannel | null;
        if (googlepayResult.paymentData) {
          // this is the channel the user used
          targetChannel = findTargetChannel(googlepayResult.paymentData);
        } else {
          // something went wrong, we have to submit because there might have been a payment
          // but we don't know the channel
          targetChannel = null;
        }
        assert(targetChannel);

        let channelProperties: ChannelProperties = {};
        const useFakeSubmissionFlow = targetChannel.channelCode !== "CARDS";
        if (!useFakeSubmissionFlow) {
          // for cards, pass the whole paymentData to backend in channel properties
          channelProperties = {
            google_pay: JSON.stringify(googlepayResult.paymentData),
          };
        }

        sdk.submitDigitalWallet(
          "GOOGLE_PAY",
          targetChannel,
          channelProperties,
          true, // always try to save for googlepay
          null,
          useFakeSubmissionFlow,
        );
      }
    }
  }, [allowedChannelCodes, business, digitalWalletsGooglePay, sdk, session, t]);

  // call onready if the googlepay sdk is ready
  useLayoutEffect(() => {
    if (!paymentsClient.current) {
      return;
    }
    if (didCallReady.current) {
      return;
    }
    if (allowedChannelCodes.length === 0) {
      return;
    }

    paymentsClient.current
      .isReadyToPay({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: digitalWalletsGooglePay.allowed_payment_methods
          .filter((method) => {
            return allowedChannelCodes.includes(method.channel_code);
          })
          .map((method) => {
            return method.payment_method_specification;
          }),
      })
      .then(function (response) {
        if (!response.result) {
          return;
        }

        if (didCallReady.current) return;
        didCallReady.current = true;
        onReady();
      })
      .catch(function (err) {
        console.error(
          "XenditComponents: Error when checking if Google Pay is ready",
          err,
        );
      });
  }, [
    allowedChannelCodes,
    digitalWalletsGooglePay.allowed_payment_methods,
    onReady,
  ]);

  // create the button
  useLayoutEffect(() => {
    if (!paymentsClient.current) {
      return;
    }
    if (allowedChannelCodes.length === 0) {
      return;
    }

    const button = paymentsClient.current.createButton({
      ...buttonConfigWithDefaults,
      buttonLocale: session.locale,
      allowedPaymentMethods: digitalWalletsGooglePay.allowed_payment_methods
        .filter((method) => {
          return allowedChannelCodes.includes(method.channel_code);
        })
        .map((method) => {
          return method.payment_method_specification;
        }),
      onClick,
    });
    if (containerRef.current) {
      containerRef.current.replaceChildren(button);
    }
  }, [
    allowedChannelCodes,
    buttonConfigWithDefaults,
    digitalWalletsGooglePay.allowed_payment_methods,
    onClick,
    session.locale,
  ]);

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

export function createGooglePaySubmissionError(
  statusCode: GooglePayErrorCode,
  t: TFunction,
) {
  return {
    code: `GOOGLE_PAY_${statusCode}` as const,
    text: [
      t(
        localeKeyForGooglePayError(statusCode, "title"),
        t("google_pay_errors.unknown_error.title"),
      ),
      t(
        localeKeyForGooglePayError(statusCode, "message"),
        t("google_pay_errors.unknown_error.message", { statusCode }),
        { statusCode },
      ),
    ],
  };
}

type GooglepayResult =
  | { type: "success"; paymentData: google.payments.api.PaymentData | null }
  | { type: "canceled" }
  | { type: "error"; statusCode: GooglePayErrorCode };

async function googlepayAsync(
  sdk: XenditComponents,
  session: BffSession,
  business: BffBusiness,
  paymentsClient: google.payments.api.PaymentsClient,
  googlePayDataFromInit: NonNullable<BffDigitalWallets["google_pay"]>,
  allowedChannelCodes: string[],
): Promise<GooglepayResult> {
  let googlePayData = googlePayDataFromInit;

  // if the config has a non-cards channel we need to populate it from the server
  const hasNonCardsChannel = googlePayDataFromInit.allowed_payment_methods.find(
    (method) => {
      return method.payment_method_specification.type !== "CARD";
    },
  );
  let needsCancel = false;
  if (hasNonCardsChannel) {
    const newDigitalWalletData = await googlepayGetConfigWrapper(sdk);
    if (newDigitalWalletData) {
      assert(newDigitalWalletData?.google_pay);
      googlePayData = newDigitalWalletData.google_pay;
      needsCancel = true;
    }
  }

  const googlepayPayload: google.payments.api.PaymentDataRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: googlePayData.allowed_payment_methods
      .filter((method) => {
        return allowedChannelCodes.includes(method.channel_code);
      })
      .map((method) => {
        return method.payment_method_specification;
      }),
    emailRequired: true,
    merchantInfo: {
      merchantId: googlePayData.merchant_id,
      merchantName: business.name ?? "",
    },
    transactionInfo: {
      transactionId: session.payment_session_id,
      totalPriceStatus: "FINAL",
      totalPrice: String(session.amount),
      currencyCode: session.currency,
      countryCode: session.country,
    },
  };

  const telemetryScope = getTelemetry(sdk).appendAndPushScope(
    TelemetryEvents.DigitalWalletBegin(true, "GOOGLE_PAY"),
  );

  try {
    const paymentData = await paymentsClient.loadPaymentData(googlepayPayload);

    getTelemetry(sdk).append(TelemetryEvents.DigitalWalletClose(true));

    return { type: "success", paymentData };
  } catch (err) {
    const statusCode =
      ((err as { statusCode?: string }).statusCode as
        | GooglePayErrorCode
        | "CANCELED") ?? "UNKNOWN_ERROR";

    getTelemetry(sdk).append(
      TelemetryEvents.DigitalWalletClose(false, statusCode),
    );

    // cancel the PRs created by googlepayGetConfigWrapper
    // We don't know if the request was sent or not, so try to cancel.
    // If the cancel endpoint returns a poll response, the payment succeeded or is pending.
    if (needsCancel) {
      let cancelResponse;
      try {
        cancelResponse = await googlepayCancelWrapper(sdk);
      } catch (err) {
        console.error("Failed to cancel googlepay", err);
        return { type: "error", statusCode: "UNKNOWN_ERROR" };
      }
      if (cancelResponse) {
        return { type: "success", paymentData: null };
      }
    }

    // the user canceled the gpay sheet and also we successfully canceled the PRs, so we can fall back to the normal flow
    if (statusCode === "CANCELED") {
      return { type: "canceled" };
    }

    return { type: "error", statusCode };
  } finally {
    getTelemetry(sdk).popScope(telemetryScope);
  }
}

export type GooglePayErrorCode =
  | "DEVELOPER_ERROR"
  | "BUYER_ACCOUNT_ERROR"
  | "MERCHANT_ACCOUNT_ERROR"
  | "INTERNAL_ERROR"
  | "UNKNOWN_ERROR";

export function localeKeyForGooglePayError<
  T extends GooglePayErrorCode,
  U extends "title" | "message",
>(errorCode: T, suffix: U) {
  return `google_pay_errors.${errorCode.toLowerCase() as Lowercase<T>}.${suffix}` as const;
}

export async function googlepayGetConfigWrapper(
  sdk: XenditComponents,
  abortSignal?: AbortSignal,
): Promise<BffDigitalWallets | undefined> {
  if (!sdk.getExperiments()["enable-gpay-lazy"]) {
    return Promise.resolve(undefined);
  }
  if (sdk.isMock()) {
    await cancellableSleep(MOCK_NETWORK_DELAY_MS, abortSignal);
    return makeMockGooglepayConfig();
  } else {
    return await googlepayGetConfig(
      sdk[internal].sdkKey,
      sdk[internal].sdkKey.sessionAuthKey,
      undefined,
      abortSignal,
    );
  }
}

export async function googlepayCancelWrapper(
  sdk: XenditComponents,
  abortSignal?: AbortSignal,
): Promise<BffPollResponse | undefined> {
  if (!sdk.getExperiments()["enable-gpay-lazy"]) {
    return Promise.resolve(undefined);
  }
  if (sdk.isMock()) {
    await cancellableSleep(MOCK_NETWORK_DELAY_MS, abortSignal);
    return undefined;
  } else {
    return await googlepayCancel(
      sdk[internal].sdkKey,
      undefined,
      sdk[internal].sdkKey.sessionAuthKey,
      undefined,
      abortSignal,
    );
  }
}
