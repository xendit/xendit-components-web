import { TFunction } from "../localization";
import { useCallback, useMemo, useRef, useState } from "preact/hooks";
import qrcode from "qrcode";
import qrSvgRenderer from "qrcode/lib/renderer/svg-tag.js";
import { amountFormat } from "../amount-format";
import { Button, ButtonLoadingSpinner, ButtonVariant } from "./core/button";
import { ComponentChildren, TargetedEvent } from "preact";
import { assert } from "../utils";

type Props = {
  amount: number;
  businessName: string;
  channelCode: string;
  channelName: string;
  channelLogo: string;
  currency: string;
  hideUi: boolean;
  onAffirm: () => void;
  qrString: string;
  enableCustomQrArt: boolean;
  title: string;
  t: TFunction;
};

export function ActionQr(props: Props) {
  const {
    amount,
    businessName,
    channelCode,
    channelName,
    channelLogo,
    currency,
    onAffirm,
    qrString,
    enableCustomQrArt,
    title,
    t,
  } = props;

  const qrArtConfig = enableCustomQrArt
    ? (QR_ART_CONFIGS[channelCode] ?? qrArtConfigDefault)
    : qrArtConfigDefault;

  const [showSpinner, setShowSpinner] = useState(false);

  const onMadePaymentClicked = useCallback(() => {
    setShowSpinner(true);
    onAffirm();
  }, [onAffirm]);

  const merchantId = qrArtConfig.emvcoQrMerchantId
    ? emvcoQrMerchantIdString(qrString, qrArtConfig)
    : null;

  const svgNode = useMemo(() => {
    try {
      return generateQrSvg(qrString, qrArtConfig);
    } catch (error) {
      console.log("Error generating QR code SVG:", error);
      // show an error message in place of the QR code
      const node = document.createElement("div");
      node.innerText = t("action_qr.unable_to_generate");
      return node;
    }
  }, [qrArtConfig, qrString, t]);

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
      <img
        src={channelLogo}
        alt={t("image_alt.channel_logo", { channelName })}
        className="xendit-action-qr-channel-logo"
      />
      <div className="xendit-action-title">{title}</div>
      <div className="xendit-action-qr-content">
        <div className="xendit-text-16 xendit-text-center xendit-qr-merchant-info">
          <div className="xendit-text-semibold">{businessName}</div>
          {merchantId ? (
            <div className="xendit-text-16 xendit-text-center">
              {merchantId}
            </div>
          ) : null}
        </div>

        <div
          data-testid="qr-code"
          className="xendit-action-qr-qrcode-container"
          role="button"
          tabIndex={0}
          onClick={onClickQrCode}
          ref={(r) => {
            if (r && (r.childNodes.length !== 1 || r.firstChild !== svgNode)) {
              // insert svg if not already present
              r?.replaceChildren(svgNode);
            }
          }}
        />
        <div className="xendit-text-16 xendit-text-semibold xendit-text-center">
          {amountFormat(amount, currency)}
        </div>
        {qrArtConfig.surroundingArt ?? null}
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
    </div>
  );
}

/**
 * Generate a qr code svg. It will have 1x1 pixels and 1px margins.
 *
 * Returns the svg node and the size of the image including margins.
 */
function generateQrSvg(text: string, artConfig: QrArtConfig): SVGSVGElement {
  const qr = qrcode.create(text);
  const svgText = qrSvgRenderer.render(qr, {
    margin: artConfig.margin,
  });
  const parser = new DOMParser();
  const svgNode = parser.parseFromString(svgText, "image/svg+xml")
    .documentElement as unknown as SVGSVGElement;

  svgNode.style.width = "100%";
  svgNode.style.height = "100%";
  svgNode.setAttribute("width", String(qr.modules.size + artConfig.margin * 2));
  svgNode.setAttribute(
    "height",
    String(qr.modules.size + artConfig.margin * 2),
  );

  // Override colors to use CSS variables

  const foregroundPath = svgNode.querySelector("[stroke]");
  foregroundPath?.setAttribute("stroke", artConfig.colors[0]);
  const backgroundPath = svgNode.querySelector("[fill]");
  backgroundPath?.setAttribute("fill", artConfig.colors[1]);
  if (artConfig.borderRadius) {
    svgNode.style.borderRadius = `${artConfig.borderRadius}px`;
  }

  return svgNode;
}

/**
 * Takes an svg node, renders it to a canvas, and downloads it as a png file.
 */
export async function downloadSvgAsPng(
  svgNode: SVGSVGElement,
  filename: string,
): Promise<void> {
  // Browser compatibility check
  if (!window.URL?.createObjectURL)
    throw new Error("Browser doesn't support URL.createObjectURL");
  if (!window.Blob) throw new Error("Browser doesn't support Blob");
  if (!document.createElement)
    throw new Error("Browser doesn't support createElement");

  // svg to string
  const svgString = new XMLSerializer().serializeToString(svgNode);
  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });

  // string to blob
  const url = URL.createObjectURL(svgBlob);

  const image = new Image();
  image.src = url;

  return new Promise((resolve, reject) => {
    image.onload = function () {
      // start with the intrinsic size for qr and the natural size for barcode
      let width: number = image.naturalWidth;
      let height: number = image.naturalHeight;

      // double the size until it is at least 256px wide
      if (width !== 0) {
        while (width < 256) {
          width *= 2;
          height *= 2;
        }
      }

      // it must be mounted before creating the canvas context or else safari will not render it correctly
      document.body.appendChild(image);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Failed to get canvas context"));
      }

      ctx.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);

      const imageDataUrl = canvas.toDataURL("image/png");
      const anchor = document.createElement("a");
      anchor.href = imageDataUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      image.remove();
      resolve();
    };
  });
}

function timestampForFilename(): string {
  const now = new Date();
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);
}

function cleanStringForFilename(str: string): string {
  return str
    .split("")
    .map((char) => {
      // replace non-alphanumeric characters with dashes, and convert to lowercase
      if (/[a-zA-Z0-9]/.test(char)) {
        return char.toLowerCase();
      } else {
        return "-";
      }
    })
    .join("")
    .replace(/-+/g, "-"); // consecutive dashes to single dash
}

type QrArtConfig = {
  margin: number;
  colors: [string, string];
  borderRadius?: number;
  emvcoQrMerchantId?: {
    location: string[];
    label: string;
  };
  merchantIdLabel?: string;
  surroundingArt?: ComponentChildren;
};

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

const QRIS_ACCENT_COLOR = "rgb(238, 54, 66)";

const QR_ART_CONFIGS: {
  [key: string]: QrArtConfig;
} = {
  QRIS: {
    margin: 1,
    colors: [
      "var(--xendit-qr-foreground-color)",
      "var(--xendit-qr-background-color)",
    ],
    borderRadius: 4,
    emvcoQrMerchantId: {
      location: ["51", "02"],
      label: "NMID: ",
    },
    surroundingArt: (
      <>
        <svg
          style={{
            position: "absolute",
            top: "5%",
            left: 0,
            width: "60%",
            height: "auto",
          }}
          viewBox="0 0 100 100"
        >
          <polygon fill={QRIS_ACCENT_COLOR} points="0,0 50,50 0,100" />
        </svg>
        <svg
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "30%",
            height: "auto",
          }}
          viewBox="0 0 100 100"
        >
          <polygon fill={QRIS_ACCENT_COLOR} points="0,100 100,100 100,0" />
        </svg>
      </>
    ),
  },
  SGQR: {
    margin: 0,
    colors: [
      "var(--xendit-channel-brand-color)",
      "var(--xendit-qr-background-color)",
    ],
  },
};

function emvcoQrMerchantIdString(
  qrString: string,
  qrArtConfig: QrArtConfig,
): string | null {
  assert(qrArtConfig.emvcoQrMerchantId);
  const { location, label } = qrArtConfig.emvcoQrMerchantId;
  try {
    let cursor = qrString;
    for (const loc of location) {
      const parsed = emvcoQrParse(cursor);
      cursor = parsed[loc];
      if (!cursor) {
        return null;
      }
    }
    return `${label}${cursor}`;
  } catch {
    // ignore
  }
  return null;
}

function emvcoQrParse(emvcoString: string): { [key: string]: string } {
  const result: { [key: string]: string } = {};
  while (emvcoString.length) {
    const currentTag = emvcoString.substring(0, 2);
    assert(/^\d{2}$/.test(currentTag));
    const length = parseInt(emvcoString.substring(2, 4), 10);
    assert(!isNaN(length));
    const value = emvcoString.substring(4, 4 + length);
    result[currentTag] = value;
    emvcoString = emvcoString.substring(4 + length);
  }

  return result;
}
