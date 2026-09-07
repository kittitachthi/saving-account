import { describe, expect, it } from "vitest";
import type { Transaction } from "../transactions/domain";
import { calculateDailyCashflow, calculateMonthlyCashflow } from "./domain";

describe("monthly cashflow domain", () => {
  it("uses the local year and month, excludes savings, and preserves fractional amounts", () => {
    const items = [
      transaction(1, "income", 10.25, new Date(2026, 0, 1, 0).toISOString()),
      transaction(
        2,
        "expense",
        1.5,
        new Date(2026, 0, 31, 23, 59).toISOString(),
      ),
      transaction(3, "income", 999, new Date(2025, 0, 1).toISOString()),
      transaction(
        4,
        "income",
        999,
        new Date(2025, 11, 31, 23, 59).toISOString(),
      ),
      transaction(5, "expense", 999, new Date(2026, 1, 1, 0).toISOString()),
      transaction(6, "saving", 100, new Date(2026, 0, 1).toISOString()),
      transaction(7, "income", 999, "invalid"),
    ];
    expect(calculateMonthlyCashflow(items, new Date(2026, 0, 15))).toEqual({
      income: 10.25,
      expense: 1.5,
    });
    expect(calculateMonthlyCashflow([], new Date(2026, 0, 15))).toEqual({
      income: 0,
      expense: 0,
    });
  });
});

const transaction = (
  id: number,
  type: Transaction["type"],
  amount: number,
  createdAt: string,
): Transaction => ({
  id,
  type,
  amount,
  createdAt,
  title: `รายการ ${id}`,
  category: type,
  date: "",
  icon: "•",
});

describe("daily cashflow domain", () => {
  it("คำนวณเฉพาะรายรับและรายจ่ายของวันท้องถิ่นปัจจุบัน", () => {
    const now = new Date(2026, 8, 3, 12);
    const result = calculateDailyCashflow(
      [
        transaction(1, "income", 3000, new Date(2026, 8, 3, 8).toISOString()),
        transaction(2, "expense", 1000, new Date(2026, 8, 3, 9).toISOString()),
        transaction(3, "saving", 5000, new Date(2026, 8, 3, 10).toISOString()),
        transaction(4, "expense", 9000, new Date(2026, 8, 2, 23).toISOString()),
      ],
      now,
    );
    expect(
      result.map(({ total, percentage }) => ({ total, percentage })),
    ).toEqual([
      { total: 3000, percentage: 75 },
      { total: 1000, percentage: 25 },
    ]);
  });

  it("คืนรายการมูลค่าสูงสุดร่วมกันครบและเรียงใหม่สุดก่อน", () => {
    const now = new Date(2026, 8, 3, 12);
    const result = calculateDailyCashflow(
      [
        transaction(1, "income", 500, new Date(2026, 8, 3, 8).toISOString()),
        transaction(2, "income", 500, new Date(2026, 8, 3, 10).toISOString()),
        transaction(3, "income", 100, new Date(2026, 8, 3, 11).toISOString()),
      ],
      now,
    )[0];
    expect(result.highest.map((item) => item.id)).toEqual([2, 1]);
  });

  it("ให้ทั้งสองฝั่งเป็น 0% เมื่อไม่มีรายการวันนี้", () => {
    expect(
      calculateDailyCashflow([], new Date()).map((item) => item.percentage),
    ).toEqual([0, 0]);
  });
});
