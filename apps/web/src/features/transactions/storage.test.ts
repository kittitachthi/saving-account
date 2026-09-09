import { describe, expect, it } from "vitest";
import {
  LEGACY_TRANSACTIONS_KEY,
  transactionStorageLoad,
  transactionStorageSave,
  TRANSACTIONS_KEY,
} from "./storage";
import type { Transaction } from "./domain";
const fallback: Transaction[] = [
  {
    id: 1,
    title: "ตัวอย่าง",
    category: "รายรับ",
    date: "",
    createdAt: "2026-09-03T10:00:00.000Z",
    amount: 1,
    type: "income",
    icon: "฿",
  },
];
const transactionStorageCreate = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: () => null,
    get length() {
      return values.size;
    },
  } satisfies Storage;
};
describe("transaction storage adapter", () => {
  it("เริ่มว่างเมื่อ JSON ใช้ไม่ได้", () => {
    const memory = transactionStorageCreate();
    memory.setItem(TRANSACTIONS_KEY, "{");
    expect(transactionStorageLoad(fallback, memory)).toEqual([]);
  });
  it("บันทึกและโหลดเฉพาะ Transaction ที่ถูกต้อง", () => {
    const memory = transactionStorageCreate();
    transactionStorageSave(fallback, memory);
    expect(transactionStorageLoad([], memory)).toEqual(fallback);
  });
  it("ล้าง storage schema เก่าและเริ่มด้วยรายการว่าง", () => {
    const memory = transactionStorageCreate();
    memory.setItem(LEGACY_TRANSACTIONS_KEY, JSON.stringify([{ id: 1 }]));
    expect(transactionStorageLoad([], memory)).toEqual([]);
    expect(memory.getItem(LEGACY_TRANSACTIONS_KEY)).toBeNull();
  });
});
