import { TFunction } from "i18next";
import { useCallback, useMemo, useState } from "preact/hooks";
import qrcode from "qrcode";
import qrSvgRenderer from "qrcode/lib/renderer/svg-tag";
import { amountFormat } from "../amount-format";
import { Button, ButtonLoadingSpinner, ButtonVariant } from "./button";

type Props = {
  amount: number;
  channelLogo: string;
  currency: string;
  hideUi: boolean;
  mock: boolean;
  onAffirm: () => void;
  qrCodeOptions?: {
    backgroundColor?: string;
    foregroundColor?: string;
  };
  qrString: string;
  t: TFunction<"session">;
  title: string;
};

export function ActionQr(props: Props) {
  const {
    amount,
    channelLogo,
    currency,
    mock,
    onAffirm,
    qrCodeOptions,
    qrString,
    t,
    title,
  } = props;

  const [showSpinner, setShowSpinner] = useState(false);

  const onMadePaymentClicked = useCallback(() => {
    setShowSpinner(true);

    if (mock) {
      onAffirm();
      return;
    }
  }, [mock, onAffirm]);

  const svgNode = useMemo(() => {
    try {
      return generateQrSvg(
        qrString,
        qrCodeOptions?.foregroundColor,
        qrCodeOptions?.backgroundColor,
      );
    } catch (error) {
      // show the error message in place of the QR code
      const node = document.createElement("div");
      node.innerText = (error as Error).message;
      return node;
    }
  }, [
    qrString,
    qrCodeOptions?.foregroundColor,
    qrCodeOptions?.backgroundColor,
  ]);

  if (props.hideUi) {
    return (
      <div
        data-testid="qr-code"
        ref={(r) => {
          if (r && (r.childNodes.length !== 1 || r.firstChild !== svgNode)) {
            // insert svg if not already present
            r?.replaceChildren(svgNode);
          }
        }}
      />
    );
  }

  return (
    <div className="xendit-action-present-to-customer">
      <div className="xendit-action-present-to-customer-header">
        <div className="xendit-text-20 xendit-text-semibold xendit-text-center">
          {title}
        </div>
      </div>
      <div className="xendit-action-present-to-customer-content">
        <div className="xendit-action-qr-content">
          <div className="xendit-action-qr-channel-logo-container">
            <img
              src={channelLogo}
              alt="Channel Logo"
              className="xendit-action-qr-channel-logo"
            />
          </div>
          <div
            data-testid="qr-code"
            className="xendit-action-qr-qrcode-container"
            ref={(r) => {
              if (
                r &&
                (r.childNodes.length !== 1 || r.firstChild !== svgNode)
              ) {
                // insert svg if not already present
                r?.replaceChildren(svgNode);
              }
            }}
          />
          <div className="xendit-action-qr-amount-container">
            <div className="xendit-text-18 xendit-text-semibold xendit-text-center">
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

/**
 * Generate a qr code svg. It will have 1x1 pixels and 1px margins.
 *
 * Returns the svg node and the size of the image including margins.
 */
function generateQrSvg(
  text: string,
  darkColor?: string,
  lightColor?: string,
): SVGSVGElement {
  if (darkColor && !isHexColorCode(darkColor)) {
    throw new Error(`Invalid darkColor hex color code: ${darkColor}`);
  }
  if (lightColor && !isHexColorCode(lightColor)) {
    throw new Error(`Invalid lightColor hex color code: ${lightColor}`);
  }
  darkColor = darkColor ?? "#000000";
  lightColor = lightColor ?? "#ffffff";

  const qr = qrcode.create(text);
  const margin = 1;
  const svgText = qrSvgRenderer.render(qr, {
    margin,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });
  const parser = new DOMParser();
  const svgNode = parser.parseFromString(svgText, "image/svg+xml")
    .documentElement as unknown as SVGSVGElement;

  svgNode.style.width = "100%";
  svgNode.style.height = "100%";
  svgNode.setAttribute("width", String(qr.modules.size + margin * 2));
  svgNode.setAttribute("height", String(qr.modules.size + margin * 2));

  return svgNode;
}

function isHexColorCode(s: string) {
  return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(s);
}
