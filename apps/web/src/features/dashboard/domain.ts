import type { Transaction, TransactionType } from "../transactions";

export function calculateMonthlyCashflow(items: Transaction[], now: Date) {
  return items.reduce(
    (totals, item) => {
      const date = new Date(item.createdAt ?? "");
      if (
        (item.type === "income" || item.type === "expense") &&
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      ) {
        totals[item.type] += item.amount;
      }
      return totals;
    },
    { income: 0, expense: 0 },
  );
}

export type CashflowSegment = {
  type: Extract<TransactionType, "income" | "expense">;
  total: number;
  percentage: number;
  count: number;
  highest: Transaction[];
};
const isSameLocalDay = (value: string | undefined, now: Date) => {
  if (!value) return false;
  const date = new Date(value);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};
export const calculateDailyCashflow = (
  items: Transaction[],
  now = new Date(),
): CashflowSegment[] => {
  const today = items.filter(
    (item) =>
      (item.type === "income" || item.type === "expense") &&
      isSameLocalDay(item.createdAt, now),
  );
  const totals = { income: 0, expense: 0 };
  today.forEach((item) => {
    totals[item.type as "income" | "expense"] += item.amount;
  });
  const combined = totals.income + totals.expense;
  return (["income", "expense"] as const).map((type) => {
    const matching = today.filter((item) => item.type === type);
    const maximum = matching.length
      ? Math.max(...matching.map((item) => item.amount))
      : 0;
    return {
      type,
      total: totals[type],
      percentage: combined ? (totals[type] / combined) * 100 : 0,
      count: matching.length,
      highest: matching
        .filter((item) => item.amount === maximum)
        .sort(
          (a, b) =>
            Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? "") ||
            b.id - a.id,
        ),
    };
  });
};
