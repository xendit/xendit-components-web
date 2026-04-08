import jsbarcode from "jsbarcode";

export function generateBarcodeSvg(text: string) {
  const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  jsbarcode(svgNode, text, barcodeOpts);
  return svgNode;
}

const barcodeOpts = {
  format: "CODE128",
  renderer: "svg",
  width: 2, // width in pixels of a single bar
  height: 132, // height in pixels
  displayValue: true,
  fontOptions: "",
  font: "Roboto",
  textAlign: "center",
  textPosition: "bottom",
  textMargin: 2,
  fontSize: 14,
  background: "#ffffff",
  lineColor: "#000000",
  margin: 8,
};
