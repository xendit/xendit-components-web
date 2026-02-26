import { FunctionComponent } from "preact";
import { useDigitalWallets, useSdk } from "./session-provider";
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { InternalDigitalWalletReady } from "./digital-wallet-container";

export const ChannelPickerDigitalWalletSection: FunctionComponent = (props) => {
  const sdk = useSdk();

  const containerRef = useRef<HTMLDivElement>(null);

  const digitalWallets = useDigitalWallets();
  const digitalWalletsGooglePay = digitalWallets?.google_pay;

  const [hasAnyDigitalWallet, setHasAnyDigitalWallet] = useState(false);

  useLayoutEffect(() => {
    if (containerRef.current && digitalWalletsGooglePay) {
      const el = sdk.createDigitalWalletComponent("GOOGLE_PAY");
      containerRef.current.appendChild(el);
      return () => {
        el.remove();
      };
    }
  }, [digitalWalletsGooglePay, sdk]);

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

  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.appendChild(
        sdk.createDigitalWalletComponent("APPLE_PAY"),
      );
    }
  }, [sdk]);

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
