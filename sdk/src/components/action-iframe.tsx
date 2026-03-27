import { useCallback, useLayoutEffect, useRef } from "preact/hooks";
import { IframeActionCompleteEvent } from "../../../shared/types";

type Props = {
  url: string;
  mock: boolean;
  channelCode: string;
  onIframeComplete: (event: IframeActionCompleteEvent) => void;
};

export function ActionIframe(props: Props) {
  const { url, channelCode, mock, onIframeComplete } = props;

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
    const authenticationTypeDescription =
      channelCode === "CARDS"
        ? "a 3DS authentication page"
        : "an authentication page";
    const srcDoc = mockIframeSrcDoc(authenticationTypeDescription);
    return (
      <iframe
        ref={iframeRef}
        srcDoc={srcDoc}
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

const mockIframeSrcDoc = (whatItWouldBe: string) => `
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
      <p>Normally, this would be ${whatItWouldBe}.</p>
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
