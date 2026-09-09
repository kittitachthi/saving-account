import type {
  WalletCategory,
  WalletSnapshot,
  WalletTransaction,
} from "@saving-account/contracts";

export const walletDayCalculate = (now: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

export const walletTransactionSort = (items: WalletTransaction[]) =>
  [...items].sort(
    (a, b) =>
      b.occurredOn.localeCompare(a.occurredOn) ||
      (b.occurredTime ?? "").localeCompare(a.occurredTime ?? "") ||
      b.createdAt.localeCompare(a.createdAt) ||
      b.id.localeCompare(a.id),
  );

function walletCategorySummariesCalculate(
  items: WalletTransaction[],
): WalletCategory[] {
  const groups = new Map<string, { total: number; count: number }>();
  for (const item of items) {
    const group = groups.get(item.category) ?? { total: 0, count: 0 };
    group.total += item.amount;
    group.count++;
    groups.set(item.category, group);
  }
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, group]) => ({
      name,
      ...group,
      average: Math.round(group.total / group.count),
    }));
}

export function walletSnapshotSummarize(items: WalletTransaction[], now: Date) {
  const today = walletDayCalculate(now);
  const totals = { income: 0, expense: 0, saving: 0, balance: 0 };
  const monthly = { income: 0, expense: 0 };
  for (const item of items) {
    totals[item.type] += item.amount;
    if (
      item.type !== "saving" &&
      item.occurredOn.slice(0, 7) === today.slice(0, 7)
    )
      monthly[item.type] += item.amount;
  }
  totals.balance = totals.income - totals.expense - totals.saving;
  const daily: WalletSnapshot["daily"] = (["income", "expense"] as const).map(
    (type) => {
      const matching = items.filter(
        (item) => item.type === type && item.occurredOn === today,
      );
      const maximum = matching.reduce(
        (max, item) => Math.max(max, item.amount),
        0,
      );
      return {
        type,
        total: matching.reduce((sum, item) => sum + item.amount, 0),
        count: matching.length,
        highest: walletTransactionSort(
          matching.filter((item) => item.amount === maximum),
        ),
      };
    },
  );
  return {
    today,
    nextDayAt: new Date(
      Date.parse(`${today}T00:00:00+07:00`) + 86400000,
    ).toISOString(),
    totals,
    monthly,
    daily,
    expenseCategories: walletCategorySummariesCalculate(
      items.filter(
        (item) =>
          item.type === "expense" &&
          item.occurredOn.slice(0, 7) === today.slice(0, 7),
      ),
    ),
    savingsCategories: walletCategorySummariesCalculate(
      items.filter((item) => item.type === "saving"),
    ),
  };
}
