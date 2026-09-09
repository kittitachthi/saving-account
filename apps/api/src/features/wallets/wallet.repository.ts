import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  CreateWalletTransaction,
  EditWalletTransaction,
  DeleteWalletTransaction,
  WalletUndoReceipt,
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
      | "TRANSACTION_CHANGED"
      | "UNDO_EXPIRED"
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
          (
            await tx.walletTransaction.findMany({
              where: { walletId, deletedAt: null },
            })
          ).map(toTransaction),
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
        if (!same || existing.deletedAt)
          throw new WalletAccessError("OPERATION_CONFLICT");
        return toTransaction(existing);
      }
      const sums = await tx.walletTransaction.groupBy({
        by: ["type"],
        where: { walletId, deletedAt: null },
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

  private async checkReplacement(
    tx: Prisma.TransactionClient,
    walletId: string,
    id: string,
    replacement?: { type: string; amount: bigint },
  ) {
    const sums = await tx.walletTransaction.groupBy({
      by: ["type"],
      where: { walletId, deletedAt: null, id: { not: id } },
      _sum: { amount: true },
    });
    const totals: Record<string, bigint> = {
      income: 0n,
      expense: 0n,
      saving: 0n,
    };
    for (const sum of sums) totals[sum.type] = sum._sum.amount ?? 0n;
    if (replacement) totals[replacement.type] += replacement.amount;
    if (totals.income < totals.expense + totals.saving)
      throw new WalletAccessError("INSUFFICIENT_BALANCE");
    if (
      Object.values(totals).some(
        (amount) => amount > BigInt(Number.MAX_SAFE_INTEGER),
      )
    )
      throw new WalletAccessError("AMOUNT_LIMIT");
  }

  private async changeTransaction<T>(
    userId: string,
    walletId: string,
    id: string,
    change: (
      tx: Prisma.TransactionClient,
      row: import("@prisma/client").WalletTransaction,
    ) => Promise<T>,
  ) {
    return this.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Wallet" WHERE "id" = ${walletId}::uuid FOR UPDATE`;
      await this.authorize(tx, userId, walletId);
      const row = await tx.walletTransaction.findFirst({
        where: { id, walletId },
      });
      if (!row) throw new WalletAccessError("TRANSACTION_CHANGED");
      return change(tx, row);
    });
  }

  async edit(
    userId: string,
    walletId: string,
    id: string,
    input: EditWalletTransaction,
    now = () => new Date(),
  ) {
    return this.changeTransaction(userId, walletId, id, async (tx, row) => {
      if (
        row.deletedAt ||
        row.updatedAt.toISOString() !== input.expectedUpdatedAt
      )
        throw new WalletAccessError("TRANSACTION_CHANGED");
      const { expectedUpdatedAt: _version, ...fields } = input;
      const amount = BigInt(fields.amount);
      await this.checkReplacement(tx, walletId, id, { type: row.type, amount });
      return toTransaction(
        await tx.walletTransaction.update({
          where: { id },
          data: {
            ...fields,
            amount,
            updatedAt: new Date(
              Math.max(now().getTime(), row.updatedAt.getTime() + 1),
            ),
          },
        }),
      );
    });
  }

  async remove(
    userId: string,
    walletId: string,
    id: string,
    input: DeleteWalletTransaction,
    now = () => new Date(),
  ): Promise<WalletUndoReceipt> {
    return this.changeTransaction(userId, walletId, id, async (tx, row) => {
      if (row.deleteOperationId === input.operationId && row.deletedAt) {
        return {
          operationId: input.operationId,
          undoUntil: new Date(row.deletedAt.getTime() + 5000).toISOString(),
          serverTime: now().toISOString(),
        };
      }
      if (
        row.deletedAt ||
        row.updatedAt.toISOString() !== input.expectedUpdatedAt ||
        row.deleteOperationId === input.operationId
      )
        throw new WalletAccessError("TRANSACTION_CHANGED");
      await this.checkReplacement(tx, walletId, id);
      const deletedAt = now();
      await tx.walletTransaction.update({
        where: { id },
        data: {
          deletedAt,
          deleteOperationId: input.operationId,
          updatedAt: new Date(
            Math.max(deletedAt.getTime(), row.updatedAt.getTime() + 1),
          ),
        },
      });
      return {
        operationId: input.operationId,
        undoUntil: new Date(deletedAt.getTime() + 5000).toISOString(),
        serverTime: now().toISOString(),
      };
    });
  }

  async restore(
    userId: string,
    walletId: string,
    id: string,
    operationId: string,
    now = () => new Date(),
  ) {
    return this.changeTransaction(userId, walletId, id, async (tx, row) => {
      if (row.deleteOperationId !== operationId)
        throw new WalletAccessError("TRANSACTION_CHANGED");
      // A retried successful Undo must not apply money twice or overwrite later edits.
      if (!row.deletedAt) return;
      if (now().getTime() >= row.deletedAt.getTime() + 5000)
        throw new WalletAccessError("UNDO_EXPIRED");
      await this.checkReplacement(tx, walletId, id, row);
      // Validate again after database work, while still holding the Wallet lock.
      const restoredAt = now();
      if (restoredAt.getTime() >= row.deletedAt.getTime() + 5000)
        throw new WalletAccessError("UNDO_EXPIRED");
      await tx.walletTransaction.update({
        where: { id },
        data: {
          deletedAt: null,
          updatedAt: new Date(
            Math.max(restoredAt.getTime(), row.updatedAt.getTime() + 1),
          ),
        },
      });
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
