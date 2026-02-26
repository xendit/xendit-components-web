import { FunctionComponent } from "preact";
import { useSdk } from "./session-provider";
import { useLayoutEffect, useRef } from "preact/hooks";

export const ChannelPickerDigitalWalletSection: FunctionComponent = (props) => {
  const sdk = useSdk();

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.appendChild(
        sdk.createDigitalWalletComponent("GOOGLE_PAY"),
      );
    }
  }, [sdk]);

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
      className="xendit-channel-picker-digital-wallet-section"
    ></div>
  );
};
