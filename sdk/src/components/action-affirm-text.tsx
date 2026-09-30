import { ComponentChildren } from "preact";
import { useCallback, useState } from "preact/hooks";
import { TFunction } from "../localization";

type Props = {
  isProdLive: boolean;
  onAffirm: () => void;
  // when set, a "Download QR" link comes first on the second line
  onDownload?: () => void;
  t: TFunction;
};

/**
 * The text that replaces the affirm button on action screens when session streaming is on.
 * The page updates by itself, so there is nothing to click in prod live except "Download QR".
 */
export function ActionAffirmText(props: Props) {
  const { isProdLive, onAffirm, onDownload, t } = props;

  const [simulating, setSimulating] = useState(false);

  const onSimulateClicked = useCallback(() => {
    setSimulating(true);
    onAffirm();
  }, [onAffirm]);

  const simulateSection = simulating ? (
    <>
      {t("action_qr.simulating")}
      <LoadingDots />
    </>
  ) : (
    <TextButton onClick={onSimulateClicked}>
      {t("action_qr.simulate_success")}
    </TextButton>
  );

  return (
    <div className="xendit-action-present-to-customer-affirm xendit-action-affirm-text xendit-text-12 xendit-text-secondary xendit-text-center">
      <div>{t("action_qr.make_payment_keep_page_open")}</div>
      {onDownload || !isProdLive ? (
        <div>
          {onDownload ? (
            <>
              <TextButton onClick={onDownload}>
                {t("action_qr.download_qr")}
              </TextButton>{" "}
            </>
          ) : null}
          {isProdLive ? null : simulateSection}
        </div>
      ) : null}
    </div>
  );
}

/**
 * A clickable piece of inline text, used for the actions in the text line.
 */
function TextButton(props: {
  children: ComponentChildren;
  onClick: () => void;
}) {
  const { children, onClick } = props;
  return (
    <span
      role="button"
      tabIndex={0}
      className="xendit-action-text-button"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </span>
  );
}

/**
 * Three dots after "Simulating", animated with CSS.
 */
function LoadingDots() {
  return (
    <span className="xendit-action-loading-dots" aria-hidden="true">
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </span>
  );
}
