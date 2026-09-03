export type TransactionType = "income" | "expense";
export type Transaction = {
  id: number;
  title: string;
  category: string;
  date: string;
  amount: number;
  type: TransactionType;
  icon: string;
};
export type TransactionTotals = {
  income: number;
  expense: number;
  balance: number;
};
export type RemovedTransaction = { item: Transaction; index: number };

export const isTransaction = (value: unknown): value is Transaction =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  "title" in value &&
  "amount" in value &&
  "type" in value &&
  typeof value.id === "number" &&
  typeof value.title === "string" &&
  typeof value.amount === "number" &&
  (value.type === "income" || value.type === "expense");
export const calculateTotals = (items: Transaction[]): TransactionTotals => {
  const totals = items.reduce(
    (sum, item) => ((sum[item.type] += item.amount), sum),
    { income: 0, expense: 0 },
  );
  return { ...totals, balance: totals.income - totals.expense };
};
export const filterTransactions = (
  items: Transaction[],
  filter: "all" | TransactionType,
) => (filter === "all" ? items : items.filter((item) => item.type === filter));
export const removeTransaction = (
  items: Transaction[],
  id: number,
): { transactions: Transaction[]; removed: RemovedTransaction | null } => {
  const index = items.findIndex((item) => item.id === id);
  return index < 0
    ? { transactions: items, removed: null }
    : {
        transactions: items.filter((item) => item.id !== id),
        removed: { item: items[index], index },
      };
};
export const restoreTransaction = (
  items: Transaction[],
  removed: RemovedTransaction,
) => {
  const next = [...items];
  next.splice(Math.min(removed.index, next.length), 0, removed.item);
  return next;
};
