import { ComponentChildren } from "preact";
import { useCallback, useState } from "preact/hooks";
import { TFunction } from "../localization";

type Props = {
  isProdLive: boolean;
  onAffirm: () => void;
  onCheckStatus: () => Promise<void>;
  // when set, a "Download QR" link comes first on the second line
  onDownload?: () => void;
  t: TFunction;
};

/**
 * The two lines of text that replace the affirm button on action screens when session streaming is on.
 */
export function ActionAffirmText(props: Props) {
  const { isProdLive, onAffirm, onCheckStatus, onDownload, t } = props;

  const [simulating, setSimulating] = useState(false);
  const [statusCheck, setStatusCheck] = useState<
    "idle" | "checking" | "not_found"
  >("idle");

  const onSimulateClicked = useCallback(() => {
    setSimulating(true);
    onAffirm();
  }, [onAffirm]);

  const onCheckStatusClicked = useCallback(() => {
    if (statusCheck === "checking") {
      return;
    }
    setStatusCheck("checking");
    // only resolves while this screen is open, if the payment was found, the screen closes on "Checking..."
    onCheckStatus().then(() => {
      setStatusCheck("not_found");
    });
  }, [onCheckStatus, statusCheck]);

  let statusCheckSection: ComponentChildren = (
    <TextButton onClick={onCheckStatusClicked}>
      {t("action_qr.check_status")}
    </TextButton>
  );
  if (statusCheck === "checking") {
    statusCheckSection = (
      <>
        {t("action_qr.checking")}
        <LoadingDots />
      </>
    );
  } else if (statusCheck === "not_found") {
    statusCheckSection = (
      <TextButton onClick={onCheckStatusClicked}>
        {t("action_qr.no_payment_found")}
      </TextButton>
    );
  }

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
    <div className="xendit-action-present-to-customer-affirm xendit-action-affirm-text xendit-text-14 xendit-text-secondary xendit-text-center">
      <div>{t("action_qr.make_payment_to_proceed")}</div>
      <div>
        {onDownload ? (
          <>
            <TextButton onClick={onDownload}>
              {t("action_qr.download_qr")}
            </TextButton>{" "}
          </>
        ) : null}
        {isProdLive ? statusCheckSection : simulateSection}
      </div>
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
 * Three dots after "Checking" or "Simulating", animated with CSS.
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
