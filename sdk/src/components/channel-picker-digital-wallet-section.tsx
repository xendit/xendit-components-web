import { FunctionComponent } from "preact";
import { useSdk } from "./session-provider";
import { useLayoutEffect, useRef } from "preact/hooks";

export const ChannelPickerDigitalWalletSection: FunctionComponent = (props) => {
  const sdk = useSdk();

  const containerRef = useRef<HTMLDivElement>(null);

  const testDigitalWalletCode = "GOOGLE_PAY";

  useLayoutEffect(() => {
    if (containerRef.current) {
      console.log("render");
      console.log(sdk, containerRef);
      containerRef.current.replaceChildren(
        sdk.createDigitalWalletComponent(testDigitalWalletCode),
      );
    }
  }, [sdk]);

  return <div ref={containerRef}></div>;
};
