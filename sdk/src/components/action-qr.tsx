import { useMemo, useState } from "preact/hooks";
import qrcode from "qrcode";
import qrSvgRenderer from "qrcode/lib/renderer/svg-tag";

type Props = {
  qrString: string;
  mock: boolean;
  onSimulatePayment: () => void;
};

export function ActionQr(props: Props) {
  const { qrString, mock, onSimulatePayment } = props;

  const [simulateClicked, setSimulateClicked] = useState(false);

  const svgNode = useMemo(() => {
    return generateQrSvg(qrString);
  }, [qrString]);

  return (
    <div>
      <div
        data-testid="qr-code"
        ref={(r) => {
          if (r && (r.childNodes.length !== 1 || r.firstChild !== svgNode)) {
            // insert svg if not already present
            r?.replaceChildren(svgNode);
          }
        }}
      />

      {mock ? (
        <button
          disabled={simulateClicked}
          onClick={() => {
            setSimulateClicked(true);
            onSimulatePayment();
          }}
        >
          {simulateClicked ? "Please wait" : "Simulate Payment"}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Generate a qr code svg. It will have 1x1 pixels and 1px margins.
 *
 * Returns the svg node and the size of the image including margins.
 */
function generateQrSvg(text: string) {
  const qr = qrcode.create(text);
  const margin = 1;
  const svgText = qrSvgRenderer.render(qr, {
    margin,
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
