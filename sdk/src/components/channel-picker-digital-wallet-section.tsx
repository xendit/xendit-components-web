import { FunctionComponent } from "preact";
import { useDigitalWallets, useSdk } from "./session-provider";
import { useLayoutEffect, useRef } from "preact/hooks";

export const ChannelPickerDigitalWalletSection: FunctionComponent = (props) => {
  const sdk = useSdk();

  const containerRef = useRef<HTMLDivElement>(null);

  const digitalWallets = useDigitalWallets();

  useLayoutEffect(() => {
    if (containerRef.current && digitalWallets.google_pay) {
      containerRef.current.appendChild(
        sdk.createDigitalWalletComponent("GOOGLE_PAY"),
      );
    }
  }, [digitalWallets.google_pay, sdk]);

  return (
    <div
      ref={containerRef}
      className="xendit-channel-picker-digital-wallet-section"
    ></div>
  );
};
