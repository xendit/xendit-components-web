import { TFunction } from "i18next";
import { amountFormat } from "../amount-format";

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
    // channelLogo,
    currency,
    // mock,
    // onAffirm,
    vaNumber,
    merchantName,
    t,
    // title,
  } = props;

  return (
    <div className="xendit-action-va-content">
      <div className="xendit-action-va-details">
        <div className="xendit-action-va-heading xendit-text-12 xendit-text-semibold">
          {t("action_va.virtual_account_number")}
        </div>
        <div className="xendit-action-va-value">{vaNumber}</div>
        <div className="xendit-action-va-tag xendit-text-12">
          {merchantName}
        </div>
      </div>
      <hr className="xendit-dotted-line" />
      <div className="xendit-action-va-details">
        <div className="xendit-action-va-heading xendit-text-12 xendit-text-semibold">
          {t("action_va.amount_to_pay")}
        </div>
        <div className="xendit-action-va-value">
          {amountFormat(amount, currency)}
        </div>
      </div>
    </div>
  );
}
