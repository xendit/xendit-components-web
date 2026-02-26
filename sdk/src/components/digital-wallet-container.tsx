import { FunctionComponent, JSX } from "preact";
import { DigitalWalletGooglepay } from "./digital-wallet-googlepay";
import { DigitalWalletOptions } from "../public-options-types";
import { XenditDigitalWalletCode } from "../public-data-types";
import { useCallback, useRef } from "preact/hooks";
import { DigitalWalletWaitForLoad } from "./digital-wallet-wait-for-load";

type Props<T extends XenditDigitalWalletCode> = {
  digitalWalletCode: T;
  digitalWalletOptions?: DigitalWalletOptions<T>;
};

export const DigitalWalletContainer: FunctionComponent<
  Props<XenditDigitalWalletCode>
> = (props) => {
  const { digitalWalletCode, digitalWalletOptions } = props;

  const containerRef = useRef<HTMLDivElement>(null);

  const onReady = useCallback(() => {
    containerRef.current?.parentElement?.style.setProperty("display", "block");
  }, []);

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
            options={digitalWalletOptions}
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
};
