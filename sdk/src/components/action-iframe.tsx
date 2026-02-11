import { useCallback, useLayoutEffect, useRef } from "preact/hooks";
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

  useLayoutEffect(() => {
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
        className="xendit-action-iframe"
      />
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={url}
      // sandbox="allow-scripts"
      className="xendit-action-iframe"
    />
  );
}

const MOCK_IFRAME_SRCDOC = `
  <html>
    <head>
      <title>Xendit Mock Action Iframe</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 14px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }
        p {
          margin: 0;
        }
        .buttons {
          display: flex;
          gap: 8px;
        }
        button {
          font-size: 12px;
          display: flex;
          align-items: center;
          text-align: left;
          background-color: white;
          border: 1px solid rgba(243, 243, 243);
          border-radius: 4px;
          justify-content: space-between;
          padding: 4px;
          cursor: pointer;
        }
        button:hover {
          border-color: #1762ee;
          background-color: #1762ee;
          color: white;
        }
      </style>
    </head>
    <body>
      <p>This is a mock action page.</p>
      <p>Normally, this would be a 3DS authentication page.</p>
      <p>Click a button below to simulate the result of the action.</p>
      <div class="buttons">
        <button onclick="parent.postMessage({type: 'xendit-iframe-action-complete', mockStatus: 'success'}, '*')">
          Simulate Success
        </button>
        <button onclick="parent.postMessage({type: 'xendit-iframe-action-complete', mockStatus: 'fail'}, '*')">
          Simulate Failure
        </button>
      </div>
    </body>
  </html>
`;
