import { TFunction } from "../localization";
import { useCallback, useMemo, useRef, useState } from "preact/hooks";
import { emvcoQrParse } from "../emvco-qr";
import { amountFormat } from "../amount-format";
import { Button, ButtonLoadingSpinner, ButtonVariant } from "./core/button";
import { TargetedEvent } from "preact";
import { getCustomQrArtComponent } from "./action-qr-custom-art";
import {
  cleanStringForFilename,
  downloadSvgAsPng,
  generateQrSvg,
  QrArtConfig,
  timestampForFilename,
} from "./action-qr-utils";
import { useActionCard } from "./action-card";

type Props = {
  amount: number;
  businessName: string;
  channelCodeForQrArt: string;
  channelName: string;
  channelLogo: string;
  currency: string;
  hideUi: boolean;
  onAffirm: () => void;
  qrString: string;
  title: string;
  t: TFunction;
};

export function ActionQr(props: Props) {
  const {
    amount,
    businessName,
    channelCodeForQrArt,
    channelName,
    channelLogo,
    currency,
    onAffirm,
    qrString,
    t,
  } = props;

  const [showSpinner, setShowSpinner] = useState(false);

  const onMadePaymentClicked = useCallback(() => {
    setShowSpinner(true);
    onAffirm();
  }, [onAffirm]);

  const svgNode = useMemo(() => {
    try {
      return generateQrSvg(qrString, qrArtConfigDefault);
    } catch (error) {
      console.log("Error generating QR code SVG:", error);
      // show an error message in place of the QR code
      const node = document.createElement("div");
      node.innerText = t("action_qr.unable_to_generate");
      return node;
    }
  }, [qrString, t]);

  const nmid = useMemo(() => {
    try {
      const parsed = emvcoQrParse(qrString);
      const info = parsed.merchantAccountInformation;
      if (!info || typeof info === "string") return undefined;
      const qrisInfo = (info as Record<string, unknown>)["ID.CO.QRIS.WWW"];
      if (!qrisInfo || typeof qrisInfo === "string") return undefined;
      const nmidValue = (qrisInfo as Record<string, unknown>).nmid;
      return typeof nmidValue === "string" ? nmidValue : undefined;
    } catch {
      return undefined;
    }
  }, [qrString]);

  const didDownload = useRef(false);
  const onClickQrCode = useCallback(
    (event: TargetedEvent<HTMLDivElement>) => {
      if (event instanceof PointerEvent && event.pointerType !== "touch") {
        // only download on touch devices, only phone users need to save the qr code, desktop users can scan it with their phone
        return;
      }

      if (didDownload.current) {
        // prevent multiple downloads
        return;
      }

      event.currentTarget.animate?.(
        [
          { transform: "scale(1)" },
          { transform: "scale(0.95)" },
          { transform: "scale(1)" },
        ],
        {
          duration: 150,
          easing: "ease-in-out",
        },
      );

      const svgNode = generateQrSvg(qrString, qrArtConfigForDownload);
      const filename = [
        cleanStringForFilename(businessName),
        cleanStringForFilename(channelName),
        cleanStringForFilename(currency),
        cleanStringForFilename(String(amount)),
        cleanStringForFilename(timestampForFilename()),
      ].join("-");

      didDownload.current = true;
      downloadSvgAsPng(svgNode, `${filename}.png`).catch((error) => {
        console.error("Error downloading QR code:", error);
      });
    },
    [amount, businessName, channelName, currency, qrString],
  );

  const inActionCard = useActionCard();

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

  const qrWrapper = (
    <div
      data-testid="qr-code"
      className="xendit-action-qr-qrcode-container"
      role="button"
      tabIndex={0}
      onClick={onClickQrCode}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClickQrCode(e);
        }
      }}
      ref={(r) => {
        if (r && (r.childNodes.length !== 1 || r.firstChild !== svgNode)) {
          // insert svg if not already present
          r?.replaceChildren(svgNode);
        }
      }}
    />
  );

  const affirmSection = (
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
  );

  const amountText = amountFormat(amount, currency);

  const QrArtComponent = getCustomQrArtComponent(channelCodeForQrArt);

  if (QrArtComponent) {
    return (
      <>
        <QrArtComponent
          channelLogo={inActionCard ? undefined : channelLogo}
          channelName={channelName}
          merchantName={businessName}
          amountText={amountText}
          qr={qrWrapper}
          t={t}
          nmid={nmid}
        />
        <div
          style={{
            padding: "48px",
            paddingTop: "8px",
            paddingBottom: "24px",
          }}
        >
          {affirmSection}
        </div>
      </>
    );
  } else {
    return (
      <div className="xendit-action-present-to-customer">
        {inActionCard ? null : (
          <img
            src={channelLogo}
            alt={t("image_alt.channel_logo", { channelName })}
            className="xendit-action-qr-channel-logo"
          />
        )}
        <div className="xendit-action-qr-content">
          <div className="xendit-text-16 xendit-text-center xendit-qr-merchant-info">
            <div className="xendit-text-semibold">{businessName}</div>
          </div>
          {qrWrapper}
          <div className="xendit-text-16 xendit-text-semibold xendit-text-center">
            {amountText}
          </div>
        </div>
        {affirmSection}
      </div>
    );
  }
}

const qrArtConfigDefault: QrArtConfig = {
  margin: 0,
  colors: [
    "var(--xendit-qr-foreground-color)",
    "var(--xendit-qr-background-color)",
  ],
};

const qrArtConfigForDownload: QrArtConfig = {
  margin: 2,
  colors: ["#000", "#FFF"],
};
