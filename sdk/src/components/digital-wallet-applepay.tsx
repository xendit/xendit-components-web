import { FunctionComponent } from "preact";
import { DigitalWalletOptions } from "../public-options-types";
import { useDigitalWallets, useSession } from "./session-provider";
import { assert } from "../utils";
import { useLayoutEffect, useRef } from "preact/hooks";

type Props = {
  options?: DigitalWalletOptions<"APPLE_PAY">;
  onReady: () => void;
};

export const DigitalWalletApplepay: FunctionComponent<Props> = (props) => {
  const { onReady } = props;

  const session = useSession();

  const digitalWallets = useDigitalWallets();
  const digitalWalletsApplePay = digitalWallets.apple_pay;
  assert(digitalWalletsApplePay);

  const didCallReady = useRef(false);

  const onClick = () => {
    const applePayData = digitalWalletsApplePay;
    assert(applePayData);

    const applePaySession = new ApplePaySession(
      3,
      digitalWalletsApplePay.apple_pay_payment_request,
    );

    applePaySession.onvalidatemerchant = async (event) => {
      try {
        // const validationURL = event.validationURL;
        // TODO: call merchant validation endpoint to get merchant session
        applePaySession.completeMerchantValidation({});
      } catch (err) {
        console.error("Error validating Apple Pay merchant:", err);
        applePaySession.abort();
      }
    };

    applePaySession.onpaymentauthorized = async (event) => {
      // TODO: submit payment
    };

    applePaySession.begin();
  };

  useLayoutEffect(() => {
    if (didCallReady.current) {
      return;
    }
    if (
      ApplePaySession.supportsVersion(3) &&
      ApplePaySession.canMakePayments()
    ) {
      onReady();
      didCallReady.current = true;
    }
  }, [onReady]);

  return (
    <apple-pay-button
      onClick={onClick}
      className="xendit-apple-pay-button"
      type="plain"
      locale={session.locale}
    />
  );
};

declare module "react/jsx-runtime" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "apple-pay-button": preact.DetailedHTMLProps<
        {
          onClick: () => void;
          className?: string;
          type?: "plain" | "buy" | "donate" | "checkout";
          locale?: string;
        },
        HTMLDivElement
      >;
    }
  }
}
