import {
  CURRENCY_NUMBER_FORMAT_LOCALE,
  CURRENCY_SYMBOL_DECIMALS,
  CURRENCY_SYMBOL_POSITION,
  CURRENCY_SYMBOLS,
} from "./data/currencies";

export function amountFormat(amount: number, currency: string): string {
  let str = "";

  const isNegative = amount < 0;

  // format as number with separators and 2 decimal places
  const locale = CURRENCY_NUMBER_FORMAT_LOCALE[currency] ?? "en";
  const decimals = CURRENCY_SYMBOL_DECIMALS[currency] ?? 2;

  str = new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits: decimals,
    // Preserve fractional parts, if there are fractions where there shouldn't be that's
    // a backend problem and we should not suppress it.
    maximumFractionDigits: 20,
  }).format(Math.abs(amount));

  // remove trailing .00 or ,00 or .000 or ,000
  str = str.replace(/(\.|,)000?$/, "");

  // add currency symbol
  if (CURRENCY_SYMBOLS[currency]) {
    const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
    const positioning = CURRENCY_SYMBOL_POSITION[currency] ?? "$1";
    str = positioning.replace("$", symbol).replace("1", str);
  } else {
    str = currency + " " + str;
  }

  // add negative sign if needed
  if (isNegative) {
    str = "-" + str;
  }

  return str;
}
