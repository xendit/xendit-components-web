import { describe, expect, it } from "vitest";
import { emvcoQrParse, emvcoQrTokenize } from "./emvco-qr";
import { EmvcoQrData } from "./data/emvco-qr-schema";

const exampleMini = "0005HELLO0105WORLD";
const exampleString =
  "00020101021226570011ID.DANA.WWW011893600915015706056102091570605610303UME51440014ID.CO.QRIS.WWW0215ID20210807329890303UME5204893153033605405100005802ID5906XENDIT6015Kota Jakarta Se61051219062720115SzW8BPHhw35i1vT60490011ID.DANA.WWW0425MER2021071400774509608641050116304B00A";
const exampleWithChinese =
  "00020101021229300012D156000000000510A93FO3230Q31280012D15600000001030812345678520441115802CN5914BEST TRANSPORT6007BEIJING64200002ZH0104最佳运输0202北京540523.7253031565502016233030412340603***0708A60086670902ME91320016A0112233449988770708123456786304A13A";

describe("emvcoQrTokenize", () => {
  it("should tokenize a simple EMVCo QR string", () => {
    const result = emvcoQrTokenize(exampleMini);
    expect(result).toEqual([
      { key: "00", value: "HELLO" },
      { key: "01", value: "WORLD" },
    ]);
  });
});

describe("emvcoQrParse", () => {
  it("should parse a simple EMVCo QR string", () => {
    const result = emvcoQrParse(exampleString);
    expect(result.merchantName).toBe("XENDIT");
    expect(result.merchantCity).toBe("Kota Jakarta Se");
  });
  it("should parse merchant info fields", () => {
    const result = emvcoQrParse(exampleString);
    expect(
      (
        (result.merchantAccountInformation as EmvcoQrData)[
          "ID.CO.QRIS.WWW"
        ] as EmvcoQrData
      ).nmid,
    ).toBe("ID2021080732989");
  });
  it("should also output raw data into fieldXX", () => {
    const result = emvcoQrParse(exampleString);
    expect(result.field63).toBe("B00A");
  });
  it("should accept surrogate pair characters", () => {
    const result = emvcoQrParse(exampleWithChinese);
    expect(result.merchantName).toBe("BEST TRANSPORT");
    expect((result.language as EmvcoQrData).merchantCityAlternateLanguage).toBe(
      "北京",
    );
  });
});
