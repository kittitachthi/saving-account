import type { Transaction } from "../transactions/domain";
export const CATEGORY_NAMES = [
  "อาหาร",
  "เดินทาง",
  "ช้อปปิ้ง",
  "อื่นๆ",
] as const;
export type CategorySummary = {
  name: string;
  total: number;
  count: number;
  percentage: number;
  average: number;
  offset: number;
};
export const calculateCategorySummaries = (
  transactions: Transaction[],
): CategorySummary[] => {
  const expenses = transactions.filter((item) => item.type === "expense"),
    expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
  const base = CATEGORY_NAMES.map((name) => {
    const matching = expenses.filter((item) =>
      name === "อื่นๆ"
        ? !CATEGORY_NAMES.slice(0, 3).includes(
            item.category as (typeof CATEGORY_NAMES)[number],
          )
        : item.category === name,
    );
    const total = matching.reduce((sum, item) => sum + item.amount, 0);
    return {
      name,
      total,
      count: matching.length,
      percentage: expenseTotal ? Math.round((total / expenseTotal) * 100) : 0,
      average: matching.length ? total / matching.length : 0,
    };
  });
  return base.map((item, index) => ({
    ...item,
    offset: base
      .slice(0, index)
      .reduce((sum, current) => sum + current.percentage, 0),
  }));
};
