import { expect, it } from "vitest";
import { calculateCategorySummaries } from "./domain";
import type { Transaction } from "../transactions/domain";
it("คำนวณ Category Summary จาก Expense", () => {
  const items: Transaction[] = [
    {
      id: 1,
      title: "a",
      category: "อาหาร",
      date: "",
      amount: 50,
      type: "expense",
      icon: "",
    },
    {
      id: 2,
      title: "b",
      category: "อาหาร",
      date: "",
      amount: 150,
      type: "expense",
      icon: "",
    },
  ];
  expect(calculateCategorySummaries(items)[0]).toMatchObject({
    name: "อาหาร",
    total: 200,
    count: 2,
    percentage: 100,
    average: 100,
  });
});
