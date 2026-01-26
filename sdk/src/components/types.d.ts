declare module "qrcode/lib/renderer/svg-tag" {
  import qrcode from "qrcode";
  export function render(
    qr: qrcode.QRCode,
    options: { margin?: number },
  ): string;
}
