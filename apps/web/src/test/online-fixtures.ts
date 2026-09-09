import { vi } from "vitest";
import type { WalletSnapshot } from "@saving-account/contracts";

export function emptyWallet(): WalletSnapshot {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return {
    wallet: { id: "wallet", name: "กระเป๋าของฉัน", timezone: "Asia/Bangkok" },
    today,
    nextDayAt: new Date(
      Date.parse(`${today}T00:00:00+07:00`) + 86400000,
    ).toISOString(),
    transactions: [],
    page: 1,
    totalPages: 1,
    totals: { income: 0, expense: 0, saving: 0, balance: 0 },
    monthly: { income: 0, expense: 0, saving: 0 },
    goal: null,
    expenseCategories: [],
    savingsCategories: [],
    daily: [
      { type: "income", total: 0, count: 0, highest: [] },
      { type: "expense", total: 0, count: 0, highest: [] },
    ],
  };
}

// Auth-specific tests keep their controlled auth responses; financial prerequisites
// use explicit HTTP fixtures, while OnlineWallet tests exercise these routes directly.
export function stubApplicationFetch(
  _name: "fetch",
  mock: (path: string, options?: RequestInit) => unknown,
) {
  vi.stubGlobal("fetch", (path: string, options?: RequestInit) => {
    if (path === "/api/privacy")
      return Promise.resolve(
        Response.json({
          version: "2026-09-08",
          paragraphs: ["ประกาศทดสอบ"],
          accepted: true,
        }),
      );
    if (path.startsWith("/api/wallets/"))
      return Promise.resolve(Response.json(emptyWallet()));
    return mock(path, options);
  });
}
