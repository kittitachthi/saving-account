import type {
  WalletSnapshot,
  WalletTransaction,
} from "@saving-account/contracts";
import type { Transaction } from "../transactions";

export const presentTransaction = (item: WalletTransaction): Transaction => ({
  ...item,
  amountSatang: item.amount,
  date: item.occurredOn,
  icon: item.type === "income" ? "฿" : item.type === "saving" ? "◇" : "•",
});

export function presentWallet(snapshot: WalletSnapshot) {
  const { totals, goal } = snapshot;
  const dailyTotal = snapshot.daily.reduce((sum, item) => sum + item.total, 0);
  let expenseOffset = 0,
    savingsOffset = 0;
  return {
    transactions: snapshot.transactions.map(presentTransaction),
    // Money remains integer satang until formatted at the display/input boundary.
    totals,
    goal,
    monthly: snapshot.monthly,
    daily: snapshot.daily.map((item) => ({
      ...item,
      percentage: dailyTotal ? (item.total / dailyTotal) * 100 : 0,
      highest: item.highest.map(presentTransaction),
    })),
    expenseCategories: snapshot.expenseCategories.map((item) => {
      const percentage = snapshot.monthly.expense
        ? (item.total / snapshot.monthly.expense) * 100
        : 0;
      const result = {
        ...item,
        percentage,
        offset: expenseOffset,
      };
      expenseOffset += percentage;
      return result;
    }),
    savingsCategories: snapshot.savingsCategories.map((item) => {
      const denominator = Math.max(goal ?? 0, totals.saving);
      const percentageOfGoal = denominator
        ? (item.total / denominator) * 100
        : 0;
      const result = {
        ...item,
        shareOfSavings: totals.saving ? (item.total / totals.saving) * 100 : 0,
        shareOfGoal: goal ? (item.total / goal) * 100 : null,
        goalDifference: goal ? totals.saving - goal : null,
        percentageOfGoal,
        offset: savingsOffset,
      };
      savingsOffset += percentageOfGoal;
      return result;
    }),
  };
}
