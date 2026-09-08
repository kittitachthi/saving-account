import { describe, expect, it } from "vitest";
import { parseBahtToSatang, satangToDecimal, formatMoney } from "./money-input";
describe("money entry in decimal baht", () => {
  it("preserves exact satang including the safe integer limit", () => {
    expect(parseBahtToSatang("0.29")).toBe(29);
    expect(parseBahtToSatang("10.2")).toBe(1020);
    expect(parseBahtToSatang("90071992547409.91")).toBe(
      Number.MAX_SAFE_INTEGER,
    );
  });
  it("round trips and displays integer satang without floating-point conversion", () => {
    const maximum = Number.MAX_SAFE_INTEGER;
    expect(satangToDecimal(maximum)).toBe("90071992547409.91");
    expect(parseBahtToSatang(satangToDecimal(maximum))).toBe(maximum);
    expect(formatMoney(maximum, "satang", true)).toBe("90,071,992,547,409.91");
    expect(formatMoney(-1, "satang")).toBe("-0.01");
  });
  it.each(["", "0", "-1", "0.001", "1e3", "NaN", "90071992547409.92"])(
    "rejects invalid or unrepresentable money %s",
    (value) => {
      expect(parseBahtToSatang(value)).toBeNull();
    },
  );
});
