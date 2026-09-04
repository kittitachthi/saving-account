import { describe, expect, it } from "vitest";
import type { Transaction } from "../transactions/domain";
import { calculateSavingsCategories, savingsProgress } from "./domain";
const savings: Transaction[] = [
  {
    id: 1,
    title: "ก้อนหนึ่ง",
    category: "เงินฉุกเฉิน",
    date: "วันนี้",
    amount: 5000,
    type: "saving",
    icon: "◇",
  },
  {
    id: 2,
    title: "ก้อนสอง",
    category: "ท่องเที่ยว",
    date: "วันนี้",
    amount: 2500,
    type: "saving",
    icon: "◇",
  },
];
describe("savings domain", () => {
  it("แบ่งความยาววงแหวนตามหมวดเทียบเป้าหมาย", () =>
    expect(
      calculateSavingsCategories(savings, 10000).map(
        ({ name, percentageOfGoal, offset }) => ({
          name,
          percentageOfGoal,
          offset,
        }),
      ),
    ).toEqual([
      { name: "เงินฉุกเฉิน", percentageOfGoal: 50, offset: 0 },
      { name: "ท่องเที่ยว", percentageOfGoal: 25, offset: 50 },
    ]));
  it("คำนวณเปอร์เซ็นต์เกินเป้าหมายได้", () =>
    expect(savingsProgress(25000, 20000)).toBe(125));
  it("สร้างข้อมูล tooltip ครบจากรายการเงินจริง", () => {
    const result = calculateSavingsCategories(
      [...savings, { ...savings[0], id: 3, amount: 1000 }],
      10000,
    )[0];
    expect(result).toMatchObject({
      name: "เงินฉุกเฉิน",
      total: 6000,
      count: 2,
      average: 3000,
      shareOfSavings: (6000 / 8500) * 100,
      shareOfGoal: 60,
      goalDifference: -1500,
    });
  });
  it("ไม่สร้างค่าที่อ้างอิงเป้าหมายเมื่อยังไม่ได้ตั้งเป้า", () => {
    const result = calculateSavingsCategories(savings, null)[0];
    expect(result.shareOfGoal).toBeNull();
    expect(result.goalDifference).toBeNull();
  });
});
