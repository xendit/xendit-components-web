import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  XenditFatalErrorEvent,
  XenditComponents,
  XenditComponentsTest,
} from "xendit-components";
import { PageType } from "./types";

export const Payment: React.FC<{
  onSuccess: () => void;
  onFail: (message: string) => void;
  goToPage: (page: PageType) => void;
}> = ({ onSuccess, onFail, goToPage }) => {
  const el = useRef<HTMLDivElement | null>(null);
  const sdkRef = useRef<XenditComponents | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
    // Using the test SDK class
    let sdk: XenditComponents;
    const componentsKey = prompt(
      "Enter your Xendit Components Key (leave blank to use mock data)",
    );
    if (componentsKey === null) {
      goToPage("store");
      return;
    }

    if (componentsKey) {
      sdk = new XenditComponents({
        sessionClientKey: componentsKey,
      });
    } else {
      sdk = new XenditComponentsTest({});
    }
    sdkRef.current = sdk;

    sdk.addEventListener("init", () => {
      setLoading(false);

      const cards = sdk
        .getActiveChannels()
        .find((channel) => channel.channelCode === "CARDS");
      if (cards) {
        const component = sdk.createChannelComponent(cards);
        el.current?.replaceChildren(component);
      }
    });

    sdk.addEventListener("submission-begin", () => {
      setSubmitting(true);
    });
    sdk.addEventListener("submission-end", () => {
      setSubmitting(false);
    });
  }, [goToPage]);

  useLayoutEffect(() => {
    if (!sdkRef.current) return;

    sdkRef.current?.addEventListener("session-complete", onSuccess);
    return () => {
      sdkRef.current?.removeEventListener("session-complete", onSuccess);
    };
  }, [onSuccess]);

  useLayoutEffect(() => {
    if (!sdkRef.current) return;

    function handleError(event: XenditFatalErrorEvent) {
      onFail(event.message);
    }

    sdkRef.current?.addEventListener("fatal-error", handleError);
    return () => {
      sdkRef.current?.removeEventListener("fatal-error", handleError);
    };
  }, [onFail]);

  const onSubmit = useCallback(() => {
    sdkRef.current?.submit();
  }, []);

  return (
    <div>
      <div className="xendit-component-container" ref={el}></div>
      <button className="submit" onClick={onSubmit}>
        Submit Simulated Payment
      </button>
      {loading || submitting ? (
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      ) : null}
    </div>
  );
};
