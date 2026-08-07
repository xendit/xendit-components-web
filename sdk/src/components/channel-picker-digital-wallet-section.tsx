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
    const container = containerRef.current;
    if (!container) return;

    // A wallet stays hidden until the browser confirms the buyer can use it.
    const recheck = () => {
      setHasAnyDigitalWallet(
        Array.from(container.children).some(
          (el) => (el as HTMLElement).style.display !== "none",
        ),
      );
    };

    // Apple Pay resolves synchronously and fires its event before we attach.
    recheck();

    container.addEventListener(InternalDigitalWalletReady.type, recheck);

    // Nothing tells us when the merchant moves a wallet out, so watch the DOM.
    const observer = new MutationObserver(recheck);
    observer.observe(container, { childList: true });

    return () => {
      container.removeEventListener(InternalDigitalWalletReady.type, recheck);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className={
          hasAnyDigitalWallet
            ? "xendit-channel-picker-digital-wallet-section"
            : undefined
        }
      ></div>
      {hasAnyDigitalWallet ? (
        <div className="xendit-digital-wallet-separator">
          <div className="xendit-digital-wallet-separator-line" />
          <div className="xendit-digital-wallet-separator-text">or</div>
          <div className="xendit-digital-wallet-separator-line" />
        </div>
      ) : null}
    </>
  );
};
