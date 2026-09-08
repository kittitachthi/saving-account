// Parse decimal text before converting to Number; never multiply a floating-point baht value.
export function parseBahtToSatang(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [baht, fraction = ""] = value.split(".");
  const satang = BigInt(baht) * 100n + BigInt(fraction.padEnd(2, "0"));
  return satang > 0n && satang <= BigInt(Number.MAX_SAFE_INTEGER)
    ? Number(satang)
    : null;
}

export type MoneyUnit = "baht" | "satang";

export function satangToDecimal(value: number): string {
  const amount = BigInt(value);
  const absolute = amount < 0n ? -amount : amount;
  return `${amount < 0n ? "-" : ""}${absolute / 100n}.${String(absolute % 100n).padStart(2, "0")}`;
}

export function formatMoney(
  value: number,
  unit: MoneyUnit = "baht",
  decimals = false,
): string {
  if (unit === "baht")
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: decimals ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(value);
  const [whole, fraction] = satangToDecimal(value).split(".");
  const displayedFraction = decimals ? fraction : fraction.replace(/0+$/, "");
  const negativeZero = whole === "-0" ? "-" : "";
  return `${negativeZero}${new Intl.NumberFormat("th-TH").format(BigInt(whole))}${displayedFraction ? `.${displayedFraction}` : ""}`;
}
