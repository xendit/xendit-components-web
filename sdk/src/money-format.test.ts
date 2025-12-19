import { describe, expect, it } from "vitest";
import { moneyFormat } from "./money-format";
import {
  CURRENCY_SYMBOL_DECIMALS,
  CURRENCY_SYMBOL_POSITION,
  CURRENCY_SYMBOLS,
} from "./data/currencies";

// prettier-ignore
const bases = [0, 1, 10, 100, 1000, 10000, 100000, 1000000, -1];
const fractions = [0, 0.1, 0.12, 0.123, 0.1234];
const testCases: number[] = [];
for (const base of bases) {
  for (const fraction of fractions) {
    testCases.push(base + fraction);
  }
}

const testCurrencies = ["USD", "IDR", "PHP", "THB", "VND", "MYR"];

describe("currency formatting", () => {
  for (const currency of testCurrencies) {
    it(`should format currency values with ${currency}`, () => {
      const result = testCases.map((amount) => moneyFormat(amount, currency));
      expect(result).toMatchSnapshot();
    });
  }
  it(`should format currency values with unknown currency`, () => {
    const result = testCases.map((amount) => moneyFormat(amount, "ZZZ"));
    expect(result).toMatchSnapshot();
  });
  it(`should format every known currency`, () => {
    const codes = new Set([
      ...Object.keys(CURRENCY_SYMBOLS),
      ...Object.keys(CURRENCY_SYMBOL_POSITION),
      ...Object.keys(CURRENCY_SYMBOL_DECIMALS),
    ]);
    const output: string[] = [];
    for (const code of codes) {
      output.push(`${code}: ${moneyFormat(1000000.01, code)}`);
    }
    expect(output).toMatchSnapshot();
  });
});
