import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  CreateWalletTransaction,
  WalletSnapshot,
  WalletTransaction,
} from "@saving-account/contracts";
import { sortWalletTransactions, summarizeWallet } from "./wallet-domain.js";

export class WalletAccessError extends Error {
  constructor(
    public readonly code:
      | "PRIVACY_REQUIRED"
      | "WALLET_FORBIDDEN"
      | "INSUFFICIENT_BALANCE"
      | "AMOUNT_LIMIT"
      | "OPERATION_CONFLICT",
  ) {
    super(code);
  }
}

function toTransaction(row: {
  id: string;
  title: string;
  category: string;
  type: string;
  amount: bigint;
  occurredOn: string;
  occurredTime: string | null;
  createdAt: Date;
  updatedAt: Date;
}): WalletTransaction {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    type: row.type as WalletTransaction["type"],
    amount: Number(row.amount),
    occurredOn: row.occurredOn,
    occurredTime: row.occurredTime,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class WalletRepository {
  constructor(
    private readonly client: PrismaClient,
    private readonly noticeVersion: string,
  ) {}

  async acceptance(userId: string) {
    return !!(await this.client.privacyAcceptance.findUnique({
      where: { userId_version: { userId, version: this.noticeVersion } },
    }));
  }
  async accept(userId: string) {
    await this.client.privacyAcceptance.upsert({
      where: { userId_version: { userId, version: this.noticeVersion } },
      create: { userId, version: this.noticeVersion },
      update: {},
    });
  }

  private async authorize(
    tx: Prisma.TransactionClient,
    userId: string,
    walletId: string,
  ) {
    const accepted = await tx.privacyAcceptance.findUnique({
      where: { userId_version: { userId, version: this.noticeVersion } },
    });
    if (!accepted) throw new WalletAccessError("PRIVACY_REQUIRED");
    const membership = await tx.walletMembership.findUnique({
      where: { walletId_userId: { walletId, userId } },
      include: { wallet: true },
    });
    // Viewer reads arrive with ticket 17; no financial route bypasses membership here.
    if (
      !membership ||
      membership.role !== "OWNER" ||
      membership.wallet.ownerId !== userId
    )
      throw new WalletAccessError("WALLET_FORBIDDEN");
    return membership.wallet;
  }

  async snapshot(
    userId: string,
    walletId: string,
    filter: string,
    page: number,
    now: Date,
  ): Promise<WalletSnapshot> {
    return this.client.$transaction(
      async (tx) => {
        const wallet = await this.authorize(tx, userId, walletId);
        const items = sortWalletTransactions(
          (await tx.walletTransaction.findMany({ where: { walletId } })).map(
            toTransaction,
          ),
        );
        const goal = await tx.savingsGoal.findUnique({ where: { walletId } });
        const filtered =
          filter === "all"
            ? items
            : items.filter((item) => item.type === filter);
        const totalPages = Math.max(1, Math.ceil(filtered.length / 10));
        const currentPage = Math.min(page, totalPages);
        return {
          wallet: {
            id: wallet.id,
            name: wallet.name,
            timezone: wallet.timezone,
          },
          ...summarizeWallet(items, now),
          goal: goal ? Number(goal.amount) : null,
          transactions: filtered.slice(
            (currentPage - 1) * 10,
            currentPage * 10,
          ),
          page: currentPage,
          totalPages,
        };
      },
      { isolationLevel: "RepeatableRead" },
    );
  }

  async create(
    userId: string,
    walletId: string,
    input: CreateWalletTransaction,
  ) {
    return this.client.$transaction(async (tx) => {
      // Serialize balance checks and all money writes for this Wallet, including other devices.
      await tx.$queryRaw`SELECT "id" FROM "Wallet" WHERE "id" = ${walletId}::uuid FOR UPDATE`;
      await this.authorize(tx, userId, walletId);
      const existing = await tx.walletTransaction.findUnique({
        where: {
          walletId_operationId: { walletId, operationId: input.operationId },
        },
      });
      if (existing) {
        const same =
          existing.title === input.title &&
          existing.category === input.category &&
          existing.type === input.type &&
          existing.amount === BigInt(input.amount) &&
          existing.occurredOn === input.occurredOn &&
          existing.occurredTime === input.occurredTime;
        if (!same) throw new WalletAccessError("OPERATION_CONFLICT");
        return toTransaction(existing);
      }
      const sums = await tx.walletTransaction.groupBy({
        by: ["type"],
        where: { walletId },
        _sum: { amount: true },
      });
      const totals = { income: 0n, expense: 0n, saving: 0n };
      for (const sum of sums)
        totals[sum.type as keyof typeof totals] = sum._sum.amount ?? 0n;
      const amount = BigInt(input.amount);
      if (
        input.type !== "income" &&
        amount > totals.income - totals.expense - totals.saving
      )
        throw new WalletAccessError("INSUFFICIENT_BALANCE");
      if (totals[input.type] + amount > BigInt(Number.MAX_SAFE_INTEGER))
        throw new WalletAccessError("AMOUNT_LIMIT");
      return toTransaction(
        await tx.walletTransaction.create({
          data: { ...input, walletId, amount },
        }),
      );
    });
  }

  async setGoal(userId: string, walletId: string, amount: number) {
    await this.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Wallet" WHERE "id" = ${walletId}::uuid FOR UPDATE`;
      await this.authorize(tx, userId, walletId);
      await tx.savingsGoal.upsert({
        where: { walletId },
        create: { walletId, amount: BigInt(amount) },
        update: { amount: BigInt(amount) },
      });
    });
  }
}
