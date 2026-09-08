import { describe, expect, it } from "vitest";
import {
  summarizeWallet,
  walletDay,
  sortWalletTransactions,
} from "./wallet-domain.js";
import type { WalletTransaction } from "@saving-account/contracts";

const item = (
  id: string,
  type: WalletTransaction["type"],
  amount: number,
  occurredOn: string,
  occurredTime: string | null = null,
): WalletTransaction => ({
  id,
  type,
  amount,
  occurredOn,
  occurredTime,
  title: id,
  category: "อาหาร",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
});
describe("online wallet domain", () => {
  it("uses Bangkok day/month boundaries and exact satang totals", () => {
    const now = new Date("2026-08-31T17:00:00.000Z");
    expect(walletDay(now)).toBe("2026-09-01");
    const result = summarizeWallet(
      [
        item("old", "income", 1000, "2026-08-31"),
        item("a", "income", 10, "2026-09-01"),
        item("b", "income", 20, "2026-09-01"),
        item("c", "expense", 11, "2026-09-01"),
        item("d", "saving", 19, "2026-09-01"),
      ],
      now,
    );
    expect(result.totals).toEqual({
      income: 1030,
      expense: 11,
      saving: 19,
      balance: 1000,
    });
    expect(result.monthly).toEqual({ income: 30, expense: 11 });
    expect(result.daily[0].highest.map((x) => x.id)).toEqual(["b"]);
    expect(result.nextDayAt).toBe("2026-09-01T17:00:00.000Z");
  });
  it("orders known times before unknown times and breaks ties deterministically", () => {
    expect(
      sortWalletTransactions([
        item("a", "income", 1, "2026-09-01"),
        item("b", "income", 1, "2026-09-01"),
        item("c", "income", 1, "2026-09-01", "09:00"),
        item("d", "income", 1, "2026-09-02"),
      ]).map((x) => x.id),
    ).toEqual(["d", "c", "b", "a"]);
  });
});
