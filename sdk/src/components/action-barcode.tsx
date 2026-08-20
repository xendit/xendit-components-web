import { useCallback, useMemo, useState } from "preact/hooks";
import { amountFormat } from "../amount-format";
import { Instructions as InstructionsType } from "../backend-types/instructions";
import { TFunction } from "../localization";
import { generateBarcodeSvg } from "./action-barcode-utils";
import { Button, ButtonLoadingSpinner, ButtonVariant } from "./core/button";
import { Instructions } from "./instructions";
import { useActionCard } from "./action-card";

type Props = {
  amount: number;
  channelLogo: string;
  currency: string;
  onAffirm: () => void;
  barcodeContent: string;
  merchantName: string;
  paymentCode: string;
  instructions: InstructionsType;
  title: string;
  t: TFunction;
};

export function ActionBarcode(props: Props) {
  const {
    amount,
    channelLogo,
    currency,
    onAffirm,
    barcodeContent,
    merchantName,
    instructions,
    title,
    t,
  } = props;

  const [showSpinner, setShowSpinner] = useState(false);
  const inActionCard = useActionCard();

  const onMadePaymentClicked = useCallback(() => {
    setShowSpinner(true);
    onAffirm();
  }, [onAffirm]);

  const barcodeDetails = [
    {
      heading: t("action_barcode.merchant_name"),
      value: merchantName,
    },
    {
      heading: t("action_barcode.barcode_content"),
      value: barcodeContent,
    },
    {
      heading: t("action_barcode.amount_to_pay"),
      value: amountFormat(amount, currency),
    },
  ];

  const svgNode = useMemo(() => {
    try {
      return generateBarcodeSvg(barcodeContent);
    } catch (error) {
      console.log("Error generating barcode SVG:", error);
      // show an error message in place of the barcode
      const node = document.createElement("div");
      node.innerText = t("action_barcode.unable_to_generate");
      return node;
    }
  }, [barcodeContent, t]);

  return (
    <div className="xendit-action-present-to-customer">
      {!inActionCard ? (
        <>
          <img
            src={channelLogo}
            alt="Channel Logo"
            className="xendit-action-barcode-channel-logo"
          />
          <div className="xendit-action-title">{title}</div>
        </>
      ) : null}
      <div
        data-testid="barcode"
        className="xendit-action-barcode-barcode-container"
        role="button"
        tabIndex={0}
        ref={(r) => {
          if (r && (r.childNodes.length !== 1 || r.firstChild !== svgNode)) {
            // insert svg if not already present
            r?.replaceChildren(svgNode);
          }
        }}
      />
      <div className="xendit-action-barcode-content">
        <div className="xendit-action-barcode-details">
          {barcodeDetails.map((detail, index) => (
            <div key={index} className="xendit-action-barcode-detail-item">
              <div className="xendit-action-barcode-detail-content">
                <div className="xendit-action-barcode-heading xendit-text-12 xendit-text-semibold">
                  {detail.heading}
                </div>
                <div className="xendit-action-barcode-value xendit-text-semibold">
                  {detail.value}
                </div>
              </div>
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
