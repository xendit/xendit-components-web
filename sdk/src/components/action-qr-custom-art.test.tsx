import { afterEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/dom";
import { render } from "preact";
import {
  getCustomQrArtComponent,
  QrArtComponentProps,
} from "./action-qr-custom-art";
import { TFunction } from "../localization";

afterEach(() => {
  render(null, document.body);
});

describe("QrArtQris", () => {
  const QrArtQris = getCustomQrArtComponent("QRIS")!;

  const baseProps: QrArtComponentProps = {
    channelLogo: "https://example.com/qris.png",
    channelName: "QRIS",
    merchantName: "XENDIT",
    amountText: "Rp 10.000",
    qr: <div>QR</div>,
    t: ((key: string) => key) as TFunction,
  };

  it("renders NMID when nmid prop is provided", () => {
    render(<QrArtQris {...baseProps} nmid="ID2021080732989" />, document.body);
    expect(screen.getByText("NMID: ID2021080732989")).toBeInTheDocument();
  });

  it("does not render NMID when nmid prop is absent", () => {
    render(<QrArtQris {...baseProps} />, document.body);
    expect(screen.queryByText(/NMID:/)).not.toBeInTheDocument();
  });
});
