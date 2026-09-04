export type TransactionType = "income" | "expense" | "saving";
export type Transaction = {
  id: number;
  title: string;
  category: string;
  date: string;
  createdAt?: string;
  amount: number;
  type: TransactionType;
  icon: string;
};
export type TransactionTotals = {
  income: number;
  expense: number;
  saving: number;
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
  "createdAt" in value &&
  typeof value.createdAt === "string" &&
  !Number.isNaN(Date.parse(value.createdAt)) &&
  (value.type === "income" ||
    value.type === "expense" ||
    value.type === "saving");
export const calculateTotals = (items: Transaction[]): TransactionTotals => {
  const totals = items.reduce(
    (sum, item) => ((sum[item.type] += item.amount), sum),
    { income: 0, expense: 0, saving: 0 },
  );
  return { ...totals, balance: totals.income - totals.expense - totals.saving };
};
export const amountOverBalance = (amount: number, balance: number) =>
  Math.max(0, amount - balance);
export const canRemoveTransaction = (items: Transaction[], id: number) => {
  const item = items.find((candidate) => candidate.id === id);
  if (!item || item.type !== "income") return true;
  return calculateTotals(items).balance - item.amount >= 0;
};
export const filterTransactions = (
  items: Transaction[],
  filter: "all" | TransactionType,
) => (filter === "all" ? items : items.filter((item) => item.type === filter));

export const sortTransactionsNewestFirst = (items: Transaction[]) =>
  [...items].sort(
    (a, b) =>
      Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? "") ||
      b.id - a.id,
  );

export const formatTransactionDate = (createdAt: string, now = new Date()) => {
  const date = new Date(createdAt);
  const start = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const target = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((start - target) / 86_400_000);
  if (days === 0) return "วันนี้";
  if (days === 1) return "เมื่อวาน";
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const paginateTransactions = (
  items: Transaction[],
  page: number,
  pageSize = 10,
) => {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  return {
    items: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    currentPage,
    totalPages,
  };
};
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
