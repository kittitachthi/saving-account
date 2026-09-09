import { describe, expect, it } from "vitest";
import {
  transactionAmountOverBalanceCalculate,
  transactionTotalsCalculate,
  transactionRemoveValidate,
  transactionDateFormat,
  transactionPageCalculate,
  transactionRemove,
  transactionRestore,
  transactionNewestFirstSort,
} from "./domain";
import type { Transaction } from "./domain";

const items: Transaction[] = [
  {
    id: 1,
    title: "รายรับ",
    category: "รายรับ",
    date: "วันนี้",
    amount: 100,
    type: "income",
    icon: "฿",
  },
  {
    id: 2,
    title: "อาหาร",
    category: "อาหาร",
    date: "วันนี้",
    amount: 25,
    type: "expense",
    icon: "•",
  },
];
describe("transaction domain", () => {
  it("คำนวณยอดจาก Transaction source of truth", () =>
    expect(transactionTotalsCalculate(items)).toEqual({
      income: 100,
      expense: 25,
      saving: 0,
      balance: 75,
    }));
  it("หักเงินเก็บออกจากยอดพร้อมใช้", () =>
    expect(
      transactionTotalsCalculate([
        ...items,
        {
          id: 3,
          title: "เก็บเงิน",
          category: "เงินฉุกเฉิน",
          date: "วันนี้",
          amount: 30,
          type: "saving",
          icon: "◇",
        },
      ]),
    ).toEqual({ income: 100, expense: 25, saving: 30, balance: 45 }));
  it("คำนวณส่วนที่รายการเกินยอดพร้อมใช้", () =>
    expect(transactionAmountOverBalanceCalculate(120, 75)).toBe(45));
  it("ไม่ให้ลบรายรับหากยอดพร้อมใช้จะติดลบ", () =>
    expect(
      transactionRemoveValidate(
        [
          ...items,
          {
            id: 3,
            title: "เก็บเงิน",
            category: "เงินฉุกเฉิน",
            date: "วันนี้",
            amount: 70,
            type: "saving",
            icon: "◇",
          },
        ],
        1,
      ),
    ).toBe(false));
  it("ลบและคืน Transaction ที่ตำแหน่งเดิมโดยไม่ mutate input", () => {
    const result = transactionRemove(items, 1);
    expect(result.transactions.map((x) => x.id)).toEqual([2]);
    expect(items).toHaveLength(2);
    expect(
      transactionRestore(result.transactions, result.removed!).map((x) => x.id),
    ).toEqual([1, 2]);
  });
  it("เรียงใหม่สุดอย่างคงที่และแบ่งหน้าละ 10 รายการ", () => {
    const dated = Array.from({ length: 11 }, (_, index) => ({
      ...items[0],
      id: index + 1,
      createdAt: new Date(2026, 8, 3, 10, 0, index).toISOString(),
    }));
    const sorted = transactionNewestFirstSort(dated);
    expect(sorted[0].id).toBe(11);
    expect(transactionPageCalculate(sorted, 2).items.map((x) => x.id)).toEqual([
      1,
    ]);
  });
  it("แสดงป้ายวันนี้ เมื่อวาน และวันที่ภาษาไทยจากเวลาจริง", () => {
    const now = new Date(2026, 8, 3, 12);
    expect(
      transactionDateFormat(new Date(2026, 8, 3, 8).toISOString(), now),
    ).toBe("วันนี้");
    expect(
      transactionDateFormat(new Date(2026, 8, 2, 8).toISOString(), now),
    ).toBe("เมื่อวาน");
    expect(
      transactionDateFormat(new Date(2026, 7, 30, 8).toISOString(), now),
    ).toContain("30");
  });
});
