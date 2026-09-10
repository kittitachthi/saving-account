import type { Prisma, PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import type {
  CreateWalletTransaction,
  EditWalletTransaction,
  DeleteWalletTransaction,
  WalletUndoReceipt,
  WalletSnapshot,
  WalletTransaction,
  WalletInvitation,
  WalletSummary,
  WalletViewer,
} from "@saving-account/contracts";
import {
  walletTransactionSort,
  walletSnapshotSummarize,
} from "./wallet-domain.js";

export class WalletAccessError extends Error {
  constructor(
    public readonly code:
      | "PRIVACY_REQUIRED"
      | "WALLET_FORBIDDEN"
      | "INSUFFICIENT_BALANCE"
      | "AMOUNT_LIMIT"
      | "TRANSACTION_CHANGED"
      | "UNDO_EXPIRED"
      | "OPERATION_CONFLICT"
      | "INVITATION_INVALID",
  ) {
    super(code);
    this.name = "WalletAccessError";
  }
}

function walletTransactionResponseMap(row: {
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

  async privacyAcceptanceCheck(userId: string) {
    return !!(await this.client.privacyAcceptance.findUnique({
      where: { userId_version: { userId, version: this.noticeVersion } },
    }));
  }
  async privacyAcceptanceRecord(userId: string) {
    await this.client.privacyAcceptance.upsert({
      where: { userId_version: { userId, version: this.noticeVersion } },
      create: { userId, version: this.noticeVersion },
      update: {},
    });
  }

  private async walletOwnerAuthorize(
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

  private async walletReadAuthorize(
    tx: Prisma.TransactionClient,
    userId: string,
    walletId: string,
    now: Date,
  ) {
    const accepted = await tx.privacyAcceptance.findUnique({
      where: { userId_version: { userId, version: this.noticeVersion } },
    });
    if (!accepted) throw new WalletAccessError("PRIVACY_REQUIRED");
    const membership = await tx.walletMembership.findUnique({
      where: { walletId_userId: { walletId, userId } },
      include: { wallet: { include: { owner: true } } },
    });
    if (!membership) throw new WalletAccessError("WALLET_FORBIDDEN");
    if (
      membership.role === "VIEWER" &&
      (!membership.lastViewedAt ||
        now.getTime() - membership.lastViewedAt.getTime() >= 15 * 60_000)
    )
      await tx.walletMembership.update({
        where: { walletId_userId: { walletId, userId } },
        data: { lastViewedAt: now },
      });
    return { membership, wallet: membership.wallet };
  }

  async walletSnapshotRead(
    userId: string,
    walletId: string,
    filter: string,
    page: number,
    now: Date,
  ): Promise<WalletSnapshot> {
    return this.client.$transaction(
      async (tx) => {
        const { wallet, membership } = await this.walletReadAuthorize(
          tx,
          userId,
          walletId,
          now,
        );
        const items = walletTransactionSort(
          (
            await tx.walletTransaction.findMany({
              where: { walletId, deletedAt: null },
            })
          ).map(walletTransactionResponseMap),
        );
        const goal = await tx.savingsGoal.findUnique({ where: { walletId } });
        const availableWallets = await tx.walletMembership.findMany({
          where: { userId },
          include: { wallet: { include: { owner: true } } },
          orderBy: { wallet: { createdAt: "asc" } },
        });
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
            role: membership.role.toLowerCase() as "owner" | "viewer",
            owner: {
              displayName: wallet.owner.displayName,
              email: wallet.owner.email,
            },
          },
          availableWallets: availableWallets.map(
            ({ role, wallet: availableWallet }) => ({
              id: availableWallet.id,
              name: availableWallet.name,
              timezone: availableWallet.timezone,
              role: role.toLowerCase() as "owner" | "viewer",
              owner: {
                displayName: availableWallet.owner.displayName,
                email: availableWallet.owner.email,
              },
            }),
          ),
          ...walletSnapshotSummarize(items, now),
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

  async walletTransactionCreate(
    userId: string,
    walletId: string,
    input: CreateWalletTransaction,
  ) {
    return this.client.$transaction(async (tx) => {
      // Serialize balance checks and all money writes for this Wallet, including other devices.
      await tx.$queryRaw`SELECT "id" FROM "Wallet" WHERE "id" = ${walletId}::uuid FOR UPDATE`;
      await this.walletOwnerAuthorize(tx, userId, walletId);
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
        return walletTransactionResponseMap(existing);
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
      return walletTransactionResponseMap(
        await tx.walletTransaction.create({
          data: { ...input, walletId, amount },
        }),
      );
    });
  }

  private async walletTransactionReplacementValidate(
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

  private async walletTransactionChangeWithinLock<T>(
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
      await this.walletOwnerAuthorize(tx, userId, walletId);
      const row = await tx.walletTransaction.findFirst({
        where: { id, walletId },
      });
      if (!row) throw new WalletAccessError("TRANSACTION_CHANGED");
      return change(tx, row);
    });
  }

  async walletTransactionUpdate(
    userId: string,
    walletId: string,
    id: string,
    input: EditWalletTransaction,
    now = () => new Date(),
  ) {
    return this.walletTransactionChangeWithinLock(
      userId,
      walletId,
      id,
      async (tx, row) => {
        if (
          row.deletedAt ||
          row.updatedAt.toISOString() !== input.expectedUpdatedAt
        )
          throw new WalletAccessError("TRANSACTION_CHANGED");
        const { expectedUpdatedAt: _version, ...fields } = input;
        const amount = BigInt(fields.amount);
        await this.walletTransactionReplacementValidate(tx, walletId, id, {
          type: row.type,
          amount,
        });
        return walletTransactionResponseMap(
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
      },
    );
  }

  async walletTransactionDelete(
    userId: string,
    walletId: string,
    id: string,
    input: DeleteWalletTransaction,
    now = () => new Date(),
  ): Promise<WalletUndoReceipt> {
    return this.walletTransactionChangeWithinLock(
      userId,
      walletId,
      id,
      async (tx, row) => {
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
        await this.walletTransactionReplacementValidate(tx, walletId, id);
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
      },
    );
  }

  async walletTransactionRestore(
    userId: string,
    walletId: string,
    id: string,
    operationId: string,
    now = () => new Date(),
  ) {
    return this.walletTransactionChangeWithinLock(
      userId,
      walletId,
      id,
      async (tx, row) => {
        if (row.deleteOperationId !== operationId)
          throw new WalletAccessError("TRANSACTION_CHANGED");
        // A retried successful Undo must not apply money twice or overwrite later edits.
        if (!row.deletedAt) return;
        if (now().getTime() >= row.deletedAt.getTime() + 5000)
          throw new WalletAccessError("UNDO_EXPIRED");
        await this.walletTransactionReplacementValidate(tx, walletId, id, row);
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
      },
    );
  }

  async savingsGoalUpdate(userId: string, walletId: string, amount: number) {
    await this.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Wallet" WHERE "id" = ${walletId}::uuid FOR UPDATE`;
      await this.walletOwnerAuthorize(tx, userId, walletId);
      await tx.savingsGoal.upsert({
        where: { walletId },
        create: { walletId, amount: BigInt(amount) },
        update: { amount: BigInt(amount) },
      });
    });
  }

  async walletList(userId: string): Promise<WalletSummary[]> {
    if (!(await this.privacyAcceptanceCheck(userId)))
      throw new WalletAccessError("PRIVACY_REQUIRED");
    const memberships = await this.client.walletMembership.findMany({
      where: { userId },
      include: { wallet: { include: { owner: true } } },
      orderBy: { wallet: { createdAt: "asc" } },
    });
    return memberships.map(({ role, wallet }) => ({
      id: wallet.id,
      name: wallet.name,
      timezone: wallet.timezone,
      role: role.toLowerCase() as "owner" | "viewer",
      owner: {
        displayName: wallet.owner.displayName,
        email: wallet.owner.email,
      },
    }));
  }

  async walletExport(userId: string, walletId: string) {
    return this.client.$transaction(async (tx) => {
      const wallet = await this.walletOwnerAuthorize(tx, userId, walletId);
      const [transactions, goal] = await Promise.all([
        tx.walletTransaction.findMany({
          where: { walletId, deletedAt: null },
          orderBy: [
            { occurredOn: "asc" },
            { occurredTime: "asc" },
            { id: "asc" },
          ],
        }),
        tx.savingsGoal.findUnique({ where: { walletId } }),
      ]);
      return {
        wallet: { id: wallet.id, name: wallet.name, timezone: wallet.timezone },
        transactions: transactions.map(walletTransactionResponseMap),
        savingsGoal: goal
          ? {
              amount: Number(goal.amount),
              updatedAt: goal.updatedAt.toISOString(),
            }
          : null,
      };
    });
  }

  async walletSharingOverview(userId: string, walletId: string, now: Date) {
    return this.client.$transaction(async (tx) => {
      await this.walletOwnerAuthorize(tx, userId, walletId);
      const [invitations, memberships] = await Promise.all([
        tx.walletInvitation.findMany({
          where: { walletId, status: "PENDING" },
          orderBy: { createdAt: "desc" },
        }),
        tx.walletMembership.findMany({
          where: { walletId, role: "VIEWER" },
          include: { user: true },
          orderBy: { user: { displayName: "asc" } },
        }),
      ]);
      return {
        invitations: invitations.map((invitation): WalletInvitation => ({
          id: invitation.id,
          email: invitation.email,
          status: invitation.expiresAt <= now ? "expired" : "pending",
          expiresAt: invitation.expiresAt.toISOString(),
        })),
        viewers: memberships.map(({ user, lastViewedAt }): WalletViewer => ({
          userId: user.id,
          displayName: user.displayName,
          email: user.email,
          lastViewedAt: lastViewedAt?.toISOString() ?? null,
        })),
      };
    });
  }

  async walletInvitationCreate(
    userId: string,
    walletId: string,
    email: string,
    tokenHash: string,
    token: string,
    appOrigin: string,
    now: Date,
  ) {
    return this.client.$transaction(async (tx) => {
      const wallet = await this.walletOwnerAuthorize(tx, userId, walletId);
      const existingMember = await tx.walletMembership.findFirst({
        where: { walletId, user: { email } },
      });
      if (existingMember) throw new WalletAccessError("OPERATION_CONFLICT");
      const invitation = await tx.walletInvitation.create({
        data: {
          walletId,
          invitedById: userId,
          email,
          tokenHash,
          expiresAt: new Date(now.getTime() + 7 * 86400_000),
        },
      });
      await tx.notificationOutbox.create({
        data: {
          kind: "WALLET_INVITATION",
          dedupeKey: `wallet-invitation:${invitation.id}`,
          recipientEmail: email,
          payload: {
            walletName: wallet.name,
            invitationUrl: `${appOrigin}/?invitation=${encodeURIComponent(token)}`,
          },
        },
      });
      return {
        id: invitation.id,
        expiresAt: invitation.expiresAt.toISOString(),
      };
    });
  }

  async walletInvitationCancel(
    userId: string,
    walletId: string,
    invitationId: string,
    now: Date,
  ) {
    await this.client.$transaction(async (tx) => {
      await this.walletOwnerAuthorize(tx, userId, walletId);
      const result = await tx.walletInvitation.updateMany({
        where: {
          id: invitationId,
          walletId,
          status: "PENDING",
          expiresAt: { gt: now },
        },
        data: { status: "CANCELLED", resolvedAt: now },
      });
      if (result.count !== 1) throw new WalletAccessError("INVITATION_INVALID");
    });
  }

  async walletInvitationAccept(
    userId: string,
    email: string,
    tokenHash: string,
    now: Date,
  ) {
    return this.client.$transaction(async (tx) => {
      const acceptedNotice = await tx.privacyAcceptance.findUnique({
        where: { userId_version: { userId, version: this.noticeVersion } },
      });
      if (!acceptedNotice) throw new WalletAccessError("PRIVACY_REQUIRED");
      const rows = await tx.$queryRaw<
        Array<{ id: string }>
      >`SELECT "id" FROM "WalletInvitation" WHERE "tokenHash" = ${tokenHash} FOR UPDATE`;
      const invitation = rows[0]
        ? await tx.walletInvitation.findUnique({
            where: { id: rows[0].id },
            include: { wallet: { include: { owner: true } } },
          })
        : null;
      if (
        !invitation ||
        invitation.status !== "PENDING" ||
        invitation.expiresAt <= now ||
        invitation.email !== email
      )
        throw new WalletAccessError("INVITATION_INVALID");
      await tx.walletMembership.upsert({
        where: { walletId_userId: { walletId: invitation.walletId, userId } },
        create: { walletId: invitation.walletId, userId, role: "VIEWER" },
        update: {},
      });
      await tx.walletInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", resolvedAt: now },
      });
      await this.walletAccessNotificationCreate(
        tx,
        invitation.id,
        invitation.wallet.owner.email,
        "accepted",
        email,
      );
      return { walletId: invitation.walletId };
    });
  }

  async walletInvitationPreview(email: string, tokenHash: string, now: Date) {
    const invitation = await this.client.walletInvitation.findUnique({
      where: { tokenHash },
      include: { wallet: { include: { owner: true } } },
    });
    if (
      !invitation ||
      invitation.status !== "PENDING" ||
      invitation.expiresAt <= now ||
      invitation.email !== email
    )
      throw new WalletAccessError("INVITATION_INVALID");
    return {
      walletName: invitation.wallet.name,
      owner: {
        displayName: invitation.wallet.owner.displayName,
        email: invitation.wallet.owner.email,
      },
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  async walletViewerRevoke(userId: string, walletId: string, viewerId: string) {
    await this.client.$transaction(async (tx) => {
      const wallet = await this.walletOwnerAuthorize(tx, userId, walletId);
      const member = await tx.walletMembership.findUnique({
        where: { walletId_userId: { walletId, userId: viewerId } },
        include: { user: true },
      });
      if (!member || member.role !== "VIEWER")
        throw new WalletAccessError("WALLET_FORBIDDEN");
      await tx.walletMembership.delete({
        where: { walletId_userId: { walletId, userId: viewerId } },
      });
      await this.walletAccessNotificationCreate(
        tx,
        randomUUID(),
        wallet.ownerId === userId
          ? (await tx.user.findUniqueOrThrow({ where: { id: userId } })).email
          : "",
        "revoked",
        member.user.email,
      );
    });
  }

  async walletViewerLeave(userId: string, walletId: string) {
    await this.client.$transaction(async (tx) => {
      const member = await tx.walletMembership.findUnique({
        where: { walletId_userId: { walletId, userId } },
        include: { user: true, wallet: { include: { owner: true } } },
      });
      if (!member || member.role !== "VIEWER")
        throw new WalletAccessError("WALLET_FORBIDDEN");
      await tx.walletMembership.delete({
        where: { walletId_userId: { walletId, userId } },
      });
      await this.walletAccessNotificationCreate(
        tx,
        randomUUID(),
        member.wallet.owner.email,
        "left",
        member.user.email,
      );
    });
  }

  private async walletAccessNotificationCreate(
    tx: Prisma.TransactionClient,
    key: string,
    recipientEmail: string,
    action: string,
    viewerEmail: string,
  ) {
    await tx.notificationOutbox.create({
      data: {
        kind: "WALLET_ACCESS_CHANGED",
        dedupeKey: `wallet-access:${action}:${key}`,
        recipientEmail,
        payload: { action, viewerEmail },
      },
    });
  }
}
