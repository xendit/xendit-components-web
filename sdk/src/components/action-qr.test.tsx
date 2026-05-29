import { afterEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/dom";
import { render } from "preact";
import { ActionQr } from "./action-qr";
import { TFunction } from "../localization";

const qrisQrString =
  "00020101021226570011ID.DANA.WWW011893600915015706056102091570605610303UME51440014ID.CO.QRIS.WWW0215ID20210807329890303UME5204893153033605405100005802ID5906XENDIT6015Kota Jakarta Se61051219062720115SzW8BPHhw35i1vT60490011ID.DANA.WWW0425MER2021071400774509608641050116304B00A";

afterEach(() => {
  render(null, document.body);
});

describe("ActionQr NMID", () => {
  const baseProps = {
    amount: 10000,
    businessName: "XENDIT",
    channelCodeForQrArt: "QRIS",
    channelName: "QRIS",
    channelLogo: "https://example.com/qris.png",
    currency: "IDR",
    hideUi: false,
    onAffirm: () => {},
    title: "Complete payment",
    t: ((key: string) => key) as TFunction,
  };

  it("shows NMID when qrString contains QRIS NMID", () => {
    render(<ActionQr {...baseProps} qrString={qrisQrString} />, document.body);
    expect(screen.getByText("NMID: ID2021080732989")).toBeInTheDocument();
  });

  it("does not show NMID when qrString is invalid", () => {
    render(
      <ActionQr {...baseProps} qrString="not-a-valid-qr" />,
      document.body,
    );
    expect(screen.queryByText(/NMID:/)).not.toBeInTheDocument();
  });
});
