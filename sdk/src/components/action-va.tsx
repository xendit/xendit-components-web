import { TFunction } from "i18next";
import { useCallback, useState } from "preact/hooks";
import { amountFormat } from "../amount-format";
import { Button, ButtonLoadingSpinner, ButtonVariant } from "./button";

type Props = {
  amount: number;
  channelLogo: string;
  currency: string;
  mock: boolean;
  onAffirm: () => void;
  vaNumber: string;
  merchantName: string;
  t: TFunction<"session">;
  title: string;
};

export function ActionVa(props: Props) {
  const {
    amount,
    channelLogo,
    currency,
    mock,
    onAffirm,
    vaNumber,
    merchantName,
    t,
    // title,
  } = props;

  const [showSpinner, setShowSpinner] = useState(false);

  const onMadePaymentClicked = useCallback(() => {
    setShowSpinner(true);

    if (mock) {
      onAffirm();
      return;
    }
  }, [mock, onAffirm]);

  return (
    <div className="xendit-action-present-to-customer">
      <div className="xendit-action-va-content">
        <img
          src={channelLogo}
          alt="Channel Logo"
          className="xendit-action-qr-channel-logo"
        />
        <hr className="xendit-dotted-line" />
        <div className="xendit-action-va-details">
          <div className="xendit-action-va-detail-item">
            <div className="xendit-action-va-heading xendit-text-12 xendit-text-semibold">
              {t("action_va.virtual_account_number")}
            </div>
            <div className="xendit-action-va-value">{vaNumber}</div>
            <div className="xendit-action-va-tag xendit-text-12">
              {merchantName}
            </div>
          </div>
          <div className="xendit-action-va-detail-item">
            <div className="xendit-action-va-heading xendit-text-12 xendit-text-semibold">
              {t("action_va.amount_to_pay")}
            </div>
            <div className="xendit-action-va-value">
              {amountFormat(amount, currency)}
            </div>
          </div>
        </div>
        <hr className="xendit-dotted-line" />
        <div>
          <Button
            variant={ButtonVariant.WHITE_ROUNDED}
            disabled={showSpinner}
            onClick={onMadePaymentClicked}
            className="xendit-button-block"
          >
            {showSpinner ? <ButtonLoadingSpinner /> : t("action.payment_made")}
          </Button>
          <p className="xendit-text-12 xendit-text-secondary xendit-text-center">
            {t("action.payment_confirmation_instructions")}
          </p>
        </div>
      </div>
    </div>
  );
}
