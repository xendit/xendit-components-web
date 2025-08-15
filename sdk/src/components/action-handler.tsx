import { redirectCanBeHandledInIframe, V3Action } from "../v3-types";
import { ChannelProperties } from "../forms-types";
import Submitter from "../submitter";
import { useCallback, useEffect, useRef } from "preact/hooks";
import { Dialog } from "./dialog";

type PaymentEntity = NonNullable<(typeof Submitter.prototype)["paymentEntity"]>;

type Props = {
  isTest: boolean;
  paymentEntity: PaymentEntity;
  action: V3Action;
  channelProperties: ChannelProperties;
  triggerPoll: () => void;
  onCancel: () => void;
};

export const ActionHandler: React.FC<Props> = (props) => {
  const {
    channelProperties,
    action,
    triggerPoll,
    isTest,
    paymentEntity,
    onCancel,
  } = props;

  switch (action.type) {
    case "REDIRECT_CUSTOMER": {
      if (action.descriptor === "WEB_URL") {
        if (redirectCanBeHandledInIframe(channelProperties, action)) {
          return (
            <IframeActionHandler
              paymentEntity={paymentEntity}
              action={action}
              triggerPoll={triggerPoll}
              isTest={isTest}
              onCancel={onCancel}
            />
          );
        } else {
          return <RedirectActionHandler url={action.value} />;
        }
      } else {
        throw new Error("Cannot handle this type of redirect action");
      }
      break;
    }
    case "PRESENT_TO_CUSTOMER": {
      // TODO
      throw new Error("not implemented");
    }
  }
};

export const IframeActionHandler: React.FC<{
  isTest: boolean;
  paymentEntity: PaymentEntity;
  action: V3Action;
  triggerPoll: () => void;
  onCancel: () => void;
}> = (props) => {
  const { action, triggerPoll, isTest, paymentEntity } = props;

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleEventFromIframe = useCallback(
    (event: MessageEvent) => {
      if (!iframeRef.current) return;

      const expectedSource = iframeRef.current.contentWindow;

      if (event.source !== expectedSource) {
        // this is normal, we are not the target of this message
        return;
      }

      // TODO: validate the origin and content of the messsage

      triggerPoll();
    },
    [triggerPoll],
  );

  useEffect(() => {
    if (isTest) {
      const doc = iframeRef.current?.contentWindow?.document;
      if (!doc) return;
      doc.open();
      doc.write(testIframeHtml);
      doc.close();
    }
  }, [isTest]);

  useEffect(() => {
    window.addEventListener("message", handleEventFromIframe);
    return () => {
      window.removeEventListener("message", handleEventFromIframe);
    };
  }, [handleEventFromIframe]);

  const onCloseClick = useCallback(() => {
    props.onCancel();
  }, [props]);

  let title: string;
  if (paymentEntity.type === "request") {
    title = isTest ? "Complete your test payment" : "Complete your payment";
  } else {
    title = isTest
      ? "Finish saving your test payment method"
      : "Finish saving your payment method";
  }

  return (
    <Dialog title={title} onClose={onCloseClick}>
      <iframe
        ref={iframeRef}
        className="xendit-3ds-iframe"
        src={isTest ? undefined : action.value}
      />
    </Dialog>
  );
};

const testIframeHtml = `
<html>
  <body>
    <h1>
      Test user action in iframe
    </h1>
    <button onclick="window.parent.postMessage({ type: 'poll-status' }, '*')">
      Simulate success
    </button>
  </body>
</html>`;

export const RedirectActionHandler: React.FC<{ url: string }> = (props) => {
  const { url } = props;

  useEffect(() => {
    window.location.href = url;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <FullscreenSpinner />;
};

export const FullscreenSpinner: React.FC = () => {
  return (
    <div className="xendit-fullscreen-spinner">
      <div className="xendit-spinner"></div>
    </div>
  );
};
