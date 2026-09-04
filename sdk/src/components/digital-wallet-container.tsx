import { FunctionComponent, JSX } from "preact";
import { DigitalWalletGooglepay } from "./digital-wallet-googlepay";
import { DigitalWalletOptions } from "../public-options-types";
import { XenditDigitalWalletCode } from "../public-data-types";
import { useCallback, useRef } from "preact/hooks";
import { DigitalWalletWaitForLoad } from "./digital-wallet-wait-for-load";
import { DigitalWalletApplepay } from "./digital-wallet-applepay";
import { useSdk } from "./session-provider";
import { getTelemetry } from "../telemetry";
import { TelemetryEvents } from "../telemetry-events";

type Props<T extends XenditDigitalWalletCode> = {
  digitalWalletCode: T;
  digitalWalletOptions?: DigitalWalletOptions<T>;
};

export const DigitalWalletContainer: FunctionComponent<
  Props<XenditDigitalWalletCode>
> = (props) => {
  const { digitalWalletCode, digitalWalletOptions } = props;

  const sdk = useSdk();
  const containerRef = useRef<HTMLDivElement>(null);

  const onReady = useCallback(() => {
    if (!containerRef.current) return;
    getTelemetry(sdk).append(
      TelemetryEvents.DigitalWalletLoaded(true, digitalWalletCode),
    );
    containerRef.current.parentElement?.style.setProperty("display", "block");
    containerRef.current.dispatchEvent(
      new InternalDigitalWalletReady(digitalWalletCode),
    );
  }, [sdk, digitalWalletCode]);

  let el: JSX.Element | null = null;
  switch (digitalWalletCode) {
    case "GOOGLE_PAY": {
      el = (
        <DigitalWalletWaitForLoad
          scriptTagRegex={sdkStatusCheckers.GOOGLE_PAY.scriptTagRegex}
          checkLoaded={sdkStatusCheckers.GOOGLE_PAY.checkLoaded}
        >
          <DigitalWalletGooglepay
            onReady={onReady}
            options={digitalWalletOptions as DigitalWalletOptions<"GOOGLE_PAY">}
          />
        </DigitalWalletWaitForLoad>
      );
      break;
    }
    case "APPLE_PAY": {
      el = (
        <DigitalWalletWaitForLoad
          scriptTagRegex={sdkStatusCheckers.APPLE_PAY.scriptTagRegex}
          checkLoaded={sdkStatusCheckers.APPLE_PAY.checkLoaded}
        >
          <DigitalWalletApplepay
            onReady={onReady}
            options={digitalWalletOptions as DigitalWalletOptions<"APPLE_PAY">}
          />
        </DigitalWalletWaitForLoad>
      );
      break;
    }
  }

  return <div ref={containerRef}>{el}</div>;
};

const sdkStatusCheckers = {
  GOOGLE_PAY: {
    scriptTagRegex: /https:\/\/pay.google.com\/.*\/js\/pay.js/,
    checkLoaded: () =>
      typeof google !== "undefined" && typeof google.payments !== "undefined",
  },
  APPLE_PAY: {
    scriptTagRegex:
      /https:\/\/applepay\.cdn-apple\.com\/jsapi\/.*\/apple-pay-sdk\.js/,
    checkLoaded: () =>
      typeof window.ApplePaySession !== "undefined" &&
      customElements.get("apple-pay-button") !== undefined,
  },
};

export class InternalDigitalWalletReady extends Event {
  static type = "xendit-internal-digital-wallet-ready" as const;

  constructor(public digitalWalletCode: XenditDigitalWalletCode) {
    super(InternalDigitalWalletReady.type, { bubbles: true });
  }
}
