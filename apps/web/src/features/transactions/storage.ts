import { isTransaction } from "./domain";
import type { Transaction } from "./domain";

export const LEGACY_TRANSACTIONS_KEY = "daily-money-transactions-v1";
export const TRANSACTIONS_KEY = "daily-money-transactions-v2";
export const loadTransactions = (
  _fallback: Transaction[] = [],
  storage: Storage = localStorage,
): Transaction[] => {
  try {
    storage.removeItem(LEGACY_TRANSACTIONS_KEY);
    const saved = storage.getItem(TRANSACTIONS_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter(isTransaction) : [];
  } catch {
    return [];
  }
};
export const saveTransactions = (
  items: Transaction[],
  storage: Storage = localStorage,
) => storage.setItem(TRANSACTIONS_KEY, JSON.stringify(items));
