import { useCallback, useEffect, useRef } from "preact/hooks";
import { IframeActionCompleteEvent } from "../../../shared/types";

type Props = {
  url: string;
  mock: boolean;
  onIframeComplete: (event: IframeActionCompleteEvent) => void;
};

export function ActionIframe(props: Props) {
  const { url, mock, onIframeComplete } = props;

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleEventFromIframe = useCallback(
    (event: MessageEvent) => {
      if (!iframeRef.current) return;

      const expectedSource = iframeRef.current.contentWindow;

      if (event.source !== expectedSource) {
        // we are not the target of this message
        return;
      }

      if (
        event.data?.type ===
        ("xendit-iframe-action-complete" satisfies IframeActionCompleteEvent["type"])
      ) {
        onIframeComplete(event.data as IframeActionCompleteEvent);
      }
    },
    [onIframeComplete],
  );

  useEffect(() => {
    window.addEventListener("message", handleEventFromIframe);
    return () => {
      window.removeEventListener("message", handleEventFromIframe);
    };
  }, [handleEventFromIframe]);

  if (mock) {
    return (
      <iframe
        ref={iframeRef}
        srcDoc={MOCK_IFRAME_SRCDOC}
        width="250"
        height="400"
        className="xendit-action-iframe"
      />
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={url}
      width="250"
      height="400"
      // sandbox="allow-scripts"
      className="xendit-action-iframe"
    />
  );
}

const MOCK_IFRAME_SRCDOC = `
  <html>
    <head>
      <title>Xendit Mock Action Iframe</title>
    </head>
    <body>
      <p>This is a mock action iframe.</p>
      <p>Click the button below to simulate completion of the action.</p>
      <button onclick="parent.postMessage({type: 'xendit-iframe-action-complete', mockStatus: 'success'}, '*')">
        Simulate Success
      </button>
      <button onclick="parent.postMessage({type: 'xendit-iframe-action-complete', mockStatus: 'fail'}, '*')">
        Simulate Failure
      </button>
    </body>
  </html>
`;
