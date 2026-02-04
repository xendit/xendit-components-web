declare module "*.css" {
  const content: string;
  export default content;
}

declare module "qrcode/lib/renderer/svg-tag" {
  import qrcode from "qrcode";
  export function render(
    qr: qrcode.QRCode,
    options: { margin?: number; color?: { dark?: string; light?: string } },
  ): string;
}
