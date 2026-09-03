import { describe, expect, it } from "vitest";
import type { Transaction } from "../transactions/domain";
import { calculateDailyCashflow } from "./domain";

const transaction = (id: number, type: Transaction["type"], amount: number, createdAt: string): Transaction => ({ id, type, amount, createdAt, title: `รายการ ${id}`, category: type, date: "", icon: "•" });

describe("daily cashflow domain", () => {
  it("คำนวณเฉพาะรายรับและรายจ่ายของวันท้องถิ่นปัจจุบัน", () => {
    const now = new Date(2026, 8, 3, 12);
    const result = calculateDailyCashflow([
      transaction(1, "income", 3000, new Date(2026, 8, 3, 8).toISOString()),
      transaction(2, "expense", 1000, new Date(2026, 8, 3, 9).toISOString()),
      transaction(3, "saving", 5000, new Date(2026, 8, 3, 10).toISOString()),
      transaction(4, "expense", 9000, new Date(2026, 8, 2, 23).toISOString()),
    ], now);
    expect(result.map(({ total, percentage }) => ({ total, percentage }))).toEqual([{ total: 3000, percentage: 75 }, { total: 1000, percentage: 25 }]);
  });

  it("คืนรายการมูลค่าสูงสุดร่วมกันครบและเรียงใหม่สุดก่อน", () => {
    const now = new Date(2026, 8, 3, 12);
    const result = calculateDailyCashflow([
      transaction(1, "income", 500, new Date(2026, 8, 3, 8).toISOString()),
      transaction(2, "income", 500, new Date(2026, 8, 3, 10).toISOString()),
      transaction(3, "income", 100, new Date(2026, 8, 3, 11).toISOString()),
    ], now)[0];
    expect(result.highest.map((item) => item.id)).toEqual([2, 1]);
  });

  it("ให้ทั้งสองฝั่งเป็น 0% เมื่อไม่มีรายการวันนี้", () => {
    expect(calculateDailyCashflow([], new Date()).map((item) => item.percentage)).toEqual([0, 0]);
  });
});
