declare module "*.css" {
  const content: string;
  export default content;
}

declare module "qrcode/lib/renderer/svg-tag.js" {
  import qrcode from "qrcode";
  export function render(
    qr: qrcode.QRCode,
    options: { margin?: number },
  ): string;
}
