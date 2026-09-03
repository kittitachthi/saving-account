import type { Transaction } from "../transactions/domain";
export type SavingsCategorySummary = {
  name: string;
  total: number;
  count: number;
  average: number;
  shareOfSavings: number;
  shareOfGoal: number | null;
  goalDifference: number | null;
  percentageOfGoal: number;
  offset: number;
};
export const calculateSavingsCategories = (transactions: Transaction[], goal: number | null): SavingsCategorySummary[] => {
  const groups = new Map<string, { total: number; count: number }>();
  transactions.filter((item) => item.type === "saving").forEach((item) => {
    const current = groups.get(item.category) ?? { total: 0, count: 0 };
    groups.set(item.category, { total: current.total + item.amount, count: current.count + 1 });
  });
  const saved = [...groups.values()].reduce((sum, value) => sum + value.total, 0);
  const denominator = goal && goal > 0 ? Math.max(goal, saved) : saved;
  let offset = 0;
  return [...groups.entries()].map(([name, { total, count }]) => {
    const percentageOfGoal = denominator > 0 ? (total / denominator) * 100 : 0;
    const item = {
      name,
      total,
      count,
      average: count ? total / count : 0,
      shareOfSavings: saved ? (total / saved) * 100 : 0,
      shareOfGoal: goal && goal > 0 ? (total / goal) * 100 : null,
      goalDifference: goal && goal > 0 ? saved - goal : null,
      percentageOfGoal,
      offset,
    };
    offset += percentageOfGoal;
    return item;
  });
};
export const savingsProgress = (saved: number, goal: number | null) => goal && goal > 0 ? (saved / goal) * 100 : null;
