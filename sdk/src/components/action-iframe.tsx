import { useCallback, useEffect, useRef } from "preact/hooks";

type Props = {
  url: string;
};

export function ActionIframe(props: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleEventFromIframe = useCallback((event: MessageEvent) => {
    if (!iframeRef.current) return;

    const expectedSource = iframeRef.current.contentWindow;

    if (event.source !== expectedSource) {
      // we are not the target of this message
      return;
    }

    console.log("Received message from action iframe:", event);
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleEventFromIframe);
    return () => {
      window.removeEventListener("message", handleEventFromIframe);
    };
  }, [handleEventFromIframe]);

  return (
    <iframe
      ref={iframeRef}
      src={props.url}
      width="250"
      height="400"
      // sandbox="allow-scripts"
      className="xendit-action-iframe"
    />
  );
}
