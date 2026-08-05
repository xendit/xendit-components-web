import { FunctionComponent } from "preact";
import { useCallback, useLayoutEffect, useMemo, useRef } from "preact/hooks";
import { useDigitalWallets, useSdk, useSession } from "./session-provider";
import { XenditPaymentChannel } from "../public-data-types";
import { assert } from "../utils";
import { DigitalWalletOptions } from "../public-options-types";
import { NetworkError } from "../networking";

export const APPLE_PAY_VERSION = 14;

type ApplePayErrorCode =
  | "MERCHANT_VALIDATION_FAILED"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

type Props = {
  options?: DigitalWalletOptions<"APPLE_PAY">;
  onReady: () => void;
};

function checkApplePayAvailability(): boolean {
  try {
    if (!window.ApplePaySession) return false;
    if (!ApplePaySession.supportsVersion(APPLE_PAY_VERSION)) return false;
    if (!ApplePaySession.canMakePayments()) return false;
    return true;
  } catch {
    return false;
  }
}

export const DigitalWalletApplepay: FunctionComponent<Props> = (props) => {
  const { onReady, options } = props;

  const sdk = useSdk();
  const t = sdk.t;

  const session = useSession();
  const digitalWallets = useDigitalWallets();
  const digitalWalletsApplePay = digitalWallets?.apple_pay;
  assert(digitalWalletsApplePay);

  const didCallReady = useRef(false);

  const buttonConfigWithDefaults = useMemo(
    () => ({
      buttonStyle: "black" as const,
      buttonType: "plain" as const,
      ...options,
    }),
    [options],
  );

  const cardsChannel: XenditPaymentChannel | undefined = useMemo(
    () =>
      sdk.getActiveChannels().find((ch) => {
        if (Array.isArray(ch.channelCode)) {
          return ch.channelCode.includes("CARDS");
        }
        return ch.channelCode === "CARDS";
      }),
    [sdk],
  );

  const failSubmission = useCallback(
    (errorCode: ApplePayErrorCode) => {
      if (!cardsChannel) return;

      // Mirrors localeKeyForGooglePayError in digital-wallet-googlepay.tsx.
      function localeKeyForApplePayError<
        T extends ApplePayErrorCode,
        U extends "title" | "message",
      >(code: T, suffix: U) {
        return `apple_pay_errors.${code.toLowerCase() as Lowercase<T>}.${suffix}` as const;
      }

      const submissionError = {
        code: `APPLE_PAY_${errorCode}` as const,
        text: [
          t(
            localeKeyForApplePayError(errorCode, "title"),
            t("apple_pay_errors.unknown_error.title"),
          ),
          t(
            localeKeyForApplePayError(errorCode, "message"),
            t("apple_pay_errors.unknown_error.message"),
          ),
        ],
      };

      sdk.submitDigitalWallet("APPLE_PAY", cardsChannel, {}, submissionError);
    },
    [cardsChannel, sdk, t],
  );

  const onClick = useCallback(() => {
    if (!cardsChannel) return;

    let applePaySession: ApplePaySession;
    try {
      applePaySession = new ApplePaySession(
        APPLE_PAY_VERSION,
        digitalWalletsApplePay.apple_pay_payment_request,
      );
    } catch (err) {
      console.error("XenditComponents: Unable to start Apple Pay", err);
      failSubmission("UNKNOWN_ERROR");
      return;
    }

    applePaySession.onvalidatemerchant = async (event) => {
      try {
        const merchantSession = await sdk.validateApplePayMerchant(
          event.validationURL,
        );
        applePaySession.completeMerchantValidation(merchantSession);
      } catch (err) {
        applePaySession.abort();
        failSubmission(
          err instanceof NetworkError
            ? "MERCHANT_VALIDATION_FAILED"
            : "NETWORK_ERROR",
        );

        if (
          (sdk.isMock() || sdk.isDevelopmentEnv()) &&
          err instanceof NetworkError
        ) {
          alert(
            "Apple Pay merchant validation failed. This usually means the device isn't signed into an Apple sandbox tester account. See https://developer.apple.com/apple-pay/sandbox-testing/",
          );
        }
      }
    };

    applePaySession.onpaymentauthorized = (event) => {
      try {
        sdk.submitDigitalWallet("APPLE_PAY", cardsChannel, {
          apple_pay: JSON.stringify({
            billingContact: event.payment.billingContact,
            shippingContact: event.payment.shippingContact,
            token: event.payment.token,
          }),
        });
      } catch (err) {
        console.error(
          "XenditComponents: Unable to submit the Apple Pay payment",
          err,
        );
        applePaySession.completePayment(ApplePaySession.STATUS_FAILURE);
        return;
      }
      applePaySession.completePayment(ApplePaySession.STATUS_SUCCESS);
    };

    applePaySession.oncancel = () => {
      // User dismissed the sheet, not an error and nothing was submitted
    };

    applePaySession.begin();
  }, [cardsChannel, digitalWalletsApplePay, failSubmission, sdk]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    },
    [onClick],
  );

  useLayoutEffect(() => {
    if (didCallReady.current) return;
    if (!cardsChannel) return;
    if (!checkApplePayAvailability()) return;

    didCallReady.current = true;
    onReady();
  }, [cardsChannel, onReady]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Apple Pay"
      className="xendit-apple-pay-button-wrapper"
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <apple-pay-button
        buttonstyle={buttonConfigWithDefaults.buttonStyle}
        type={buttonConfigWithDefaults.buttonType}
        locale={session.locale}
        className="xendit-apple-pay-button"
      />
    </div>
  );
};

declare global {
  interface Window {
    ApplePaySession: typeof ApplePaySession;
  }
}

declare module "react/jsx-runtime" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "apple-pay-button": preact.DetailedHTMLProps<
        {
          buttonstyle?: string;
          type?: string;
          locale?: string;
          className?: string;
        },
        HTMLElement
      >;
    }
  }
}
