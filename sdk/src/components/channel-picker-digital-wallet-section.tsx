import { FunctionComponent } from "preact";
import { useDigitalWallets, useSdk } from "./session-provider";
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { InternalDigitalWalletReady } from "./digital-wallet-container";
import { XenditDigitalWalletCode } from "../public-data-types";

export const ChannelPickerDigitalWalletSection: FunctionComponent = (props) => {
  const sdk = useSdk();

  const containerRef = useRef<HTMLDivElement>(null);

  const digitalWallets = useDigitalWallets();

  const [hasAnyDigitalWallet, setHasAnyDigitalWallet] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Render every configured digital wallet
    const codes: XenditDigitalWalletCode[] = [];
    if (digitalWallets?.google_pay) codes.push("GOOGLE_PAY");
    if (digitalWallets?.apple_pay) codes.push("APPLE_PAY");

    const elements = codes.map((code) => {
      const el = sdk.createDigitalWalletComponent(code);
      container.appendChild(el);
      return el;
    });

    return () => {
      elements.forEach((el) => el.remove());
    };
  }, [digitalWallets, sdk]);

  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.addEventListener(
        InternalDigitalWalletReady.type,
        (e) => {
          setHasAnyDigitalWallet(true);
        },
      );
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={
        hasAnyDigitalWallet
          ? "xendit-channel-picker-digital-wallet-section"
          : undefined
      }
    ></div>
  );
};
