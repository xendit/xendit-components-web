import { FunctionComponent } from "preact";
import { useCallback, useContext, useState } from "preact/hooks";
import { amountFormat } from "../amount-format";
import { Instructions as InstructionsType } from "../backend-types/instructions";
import { TFunction } from "../localization";
import {
  Button,
  ButtonLoadingSpinner,
  ButtonSize,
  ButtonVariant,
} from "./core/button";
import Icon from "./icon";
import { Instructions } from "./instructions";
import { Tooltip, TooltipContext, TooltipProvider } from "./core/tooltip";
import { SessionTelemetry } from "../telemetry";
import { TelemetryEvents } from "../telemetry-events";

type Props = {
  amount: number;
  channelLogo: string;
  currency: string;
  onAffirm: () => void;
  vaNumber: string;
  merchantName: string;
  instructions: InstructionsType;
  title: string;
  t: TFunction;
  telemetry: SessionTelemetry;
};

export function ActionVa(props: Props) {
  const {
    amount,
    channelLogo,
    currency,
    onAffirm,
    vaNumber,
    merchantName,
    instructions,
    title,
    t,
    telemetry,
  } = props;

  const [showSpinner, setShowSpinner] = useState(false);

  const onMadePaymentClicked = useCallback(() => {
    setShowSpinner(true);
    onAffirm();
  }, [onAffirm]);

  const vaDetails = [
    {
      heading: t("action_va.merchant_name"),
      value: merchantName,
    },
    {
      heading: t("action_va.virtual_account_number"),
      value: vaNumber,
      enableCopy: true,
    },
    {
      heading: t("action_va.amount_to_pay"),
      value: amountFormat(amount, currency),
      enableCopy: true,
    },
  ];

  return (
    <div className="xendit-action-present-to-customer">
      <img
        src={channelLogo}
        alt="Channel Logo"
        className="xendit-action-qr-channel-logo"
      />
      <div className="xendit-action-title">{title}</div>
      <div className="xendit-action-va-content">
        <div className="xendit-action-va-details">
          {vaDetails.map((detail, index) => (
            <div key={index} className="xendit-action-va-detail-item">
              <div className="xendit-action-va-detail-content">
                <div className="xendit-action-va-heading xendit-text-12 xendit-text-semibold">
                  {detail.heading}
                </div>
                <div className="xendit-action-va-value xendit-text-semibold">
                  {detail.value}
                </div>
              </div>
              {detail.enableCopy ? (
                <TooltipProvider>
                  <CopyButton
                    fieldName={detail.heading}
                    telemetry={telemetry}
                    value={detail.value}
                    t={t}
                  />
                  <Tooltip />
                </TooltipProvider>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="xendit-action-present-to-customer-affirm">
        <Button
          variant={ButtonVariant.WHITE_ROUNDED}
          disabled={showSpinner}
          onClick={onMadePaymentClicked}
          className="xendit-button-block"
        >
          {showSpinner ? <ButtonLoadingSpinner /> : t("action.payment_made")}
        </Button>
        <div className="xendit-text-12 xendit-text-secondary xendit-text-center">
          {t("action.payment_confirmation_instructions")}
        </div>
      </div>
      <Instructions instructions={instructions} />
    </div>
  );
}

const CopyButton: FunctionComponent<{
  telemetry: SessionTelemetry;
  fieldName: string;
  value: string;
  t: TFunction;
}> = ({ telemetry, fieldName, value, t }) => {
  const { fire } = useContext(TooltipContext);

  return (
    <Button
      variant={ButtonVariant.WHITE_ROUNDED}
      size={ButtonSize.SM}
      onClick={() => {
        navigator.clipboard.writeText(value);

        telemetry.append(TelemetryEvents.ActionCopyText(true, fieldName));

        fire(t("action_va.copied_to_clipboard"));
      }}
    >
      {t("action_va.copy")}
      <Icon name="copy" size={16} />
    </Button>
  );
};
