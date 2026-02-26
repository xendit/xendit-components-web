import { ComponentChildren, FunctionComponent, JSX } from "preact";
import { DigitalWalletGooglepay } from "./digital-wallet-googlepay";
import { DigitalWalletOptions } from "../public-options-types";
import { XenditDigitalWalletCode } from "../public-data-types";
import { DigitalWalletApplepay } from "./digital-wallet-applepay";
import { useCallback, useLayoutEffect, useRef, useState } from "preact/hooks";

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
        <ScriptTagWaiter
          scriptTagRegex={sdkStatusCheckers.GOOGLE_PAY.scriptTagRegex}
          checkLoaded={sdkStatusCheckers.GOOGLE_PAY.checkLoaded}
        >
          <DigitalWalletGooglepay
            onReady={onReady}
            options={digitalWalletOptions}
          />
        </ScriptTagWaiter>
      );
      break;
    }
    case "APPLE_PAY": {
      el = (
        <ScriptTagWaiter
          scriptTagRegex={sdkStatusCheckers.APPLE_PAY.scriptTagRegex}
          checkLoaded={sdkStatusCheckers.APPLE_PAY.checkLoaded}
        >
          <DigitalWalletApplepay
            onReady={onReady}
            options={digitalWalletOptions}
          />
        </ScriptTagWaiter>
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
      /https:\/\/applepay.cdn-apple.com\/jsapi\/.*\/apple-pay-sdk.js/,
    checkLoaded: () => typeof ApplePaySession !== "undefined",
  },
};

const ScriptTagWaiter: FunctionComponent<{
  scriptTagRegex: RegExp;
  checkLoaded: () => boolean;
  children: ComponentChildren;
}> = (props) => {
  const { scriptTagRegex, checkLoaded, children } = props;

  const forceRender = useState({})[1];
  const ok = checkLoaded();

  useLayoutEffect(() => {
    if (ok) return;

    const targetScript = Array.from(document.scripts).find((script) =>
      scriptTagRegex.test(script.src),
    );

    targetScript?.addEventListener("load", () => {
      forceRender(1);
    });
  }, [forceRender, ok, scriptTagRegex]);

  return ok ? children : null;
};
