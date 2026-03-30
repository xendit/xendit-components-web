import qrcode from "qrcode";
import qrSvgRenderer from "qrcode/lib/renderer/svg-tag.js";

export type QrArtConfig = {
  margin: number;
  colors: [string, string];
};

/**
 * Generate a qr code svg. It will have 1x1 pixels and 1px margins.
 *
 * Returns the svg node and the size of the image including margins.
 */
export function generateQrSvg(
  text: string,
  artConfig: QrArtConfig,
): SVGSVGElement {
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
    image.onerror = function (error) {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to generate image"));
    };
  });
}

export function timestampForFilename(): string {
  const now = new Date();
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);
}

export function cleanStringForFilename(str: string): string {
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
