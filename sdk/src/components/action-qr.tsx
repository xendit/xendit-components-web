export function ActionQr(props: { qrString: string }) {
  const { qrString } = props;

  return <div>This is the QR code action for string: {qrString}</div>;
}
