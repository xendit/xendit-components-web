import { FunctionComponent } from "preact";
import { useDigitalWallets, useSdk } from "./session-provider";
import { useLayoutEffect, useRef } from "preact/hooks";

export const ChannelPickerDigitalWalletSection: FunctionComponent = (props) => {
  const sdk = useSdk();

  const containerRef = useRef<HTMLDivElement>(null);

  const digitalWallets = useDigitalWallets();
  const digitalWalletsGooglePay = digitalWallets?.google_pay;

  useLayoutEffect(() => {
    if (containerRef.current && digitalWalletsGooglePay) {
      containerRef.current.appendChild(
        sdk.createDigitalWalletComponent("GOOGLE_PAY"),
      );
    }
  }, [digitalWalletsGooglePay, sdk]);

  return (
    <div
      ref={containerRef}
      className="xendit-channel-picker-digital-wallet-section"
    ></div>
  );
};
