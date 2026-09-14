import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import type {
  AuthRepository,
  AuthenticatedUser,
  GoogleIdentity,
  OAuthAttempt,
} from "./auth.types.js";

function hashState(state: string) {
  return createHash("sha256").update(state).digest("hex");
}

function toAuthenticatedUser(user: {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  ownedWallets: Array<{ id: string }>;
}): AuthenticatedUser {
  const wallet = user.ownedWallets[0];
  if (!wallet) throw new Error("Authenticated user has no Personal Wallet");
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    personalWalletId: wallet.id,
  };
}

export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveOAuthAttempt(attempt: OAuthAttempt) {
    await this.prisma.oAuthAttempt.create({
      data: {
        stateHash: hashState(attempt.state),
        nonce: attempt.nonce,
        codeVerifier: attempt.codeVerifier,
        returnTo: attempt.returnTo,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
  }

  async consumeOAuthAttempt(state: string) {
    try {
      const attempt = await this.prisma.oAuthAttempt.delete({
        where: { stateHash: hashState(state) },
      });
      if (attempt.expiresAt <= new Date()) return null;
      return {
        state,
        nonce: attempt.nonce,
        codeVerifier: attempt.codeVerifier,
        returnTo: attempt.returnTo,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return null;
      }
      throw error;
    }
  }

  async createSessionForAllowedIdentity(
    identity: GoogleIdentity,
    tokenHash: string,
    expiresAt: Date,
    deviceLabel = "อุปกรณ์ไม่ทราบชนิด",
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const allowed = await transaction.betaAllowlist.findUnique({
        where: { email: identity.email },
      });
      if (!allowed) return null;

      const account = await transaction.authAccount.findUnique({
        where: {
          provider_providerSubject: {
            provider: "GOOGLE",
            providerSubject: identity.subject,
          },
        },
        include: {
          user: {
            include: { ownedWallets: { orderBy: { createdAt: "asc" } } },
          },
        },
      });

      let user: AuthenticatedUser & { accountRecovered?: true };
      if (account) {
        await transaction.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${account.userId}::uuid FOR UPDATE`;
        const currentUser = await transaction.user.findUniqueOrThrow({
          where: { id: account.userId },
        });
        if (
          currentUser.pendingDeletionAt &&
          currentUser.pendingDeletionAt.getTime() + 30 * 86400_000 <= Date.now()
        )
          return null;
        const updated = await transaction.user.update({
          where: { id: account.userId },
          data: {
            displayName: identity.displayName,
            email: identity.email,
            avatarUrl: identity.avatarUrl,
            pendingDeletionAt: null,
          },
          include: { ownedWallets: { orderBy: { createdAt: "asc" } } },
        });
        await transaction.accountDeletionJob.deleteMany({
          where: { userId: account.userId },
        });
        user = {
          ...toAuthenticatedUser(updated),
          ...(currentUser.pendingDeletionAt
            ? { accountRecovered: true as const }
            : {}),
        };
      } else {
        const emailOwner = await transaction.user.findUnique({
          where: { email: identity.email },
        });
        if (emailOwner) return null;

        const created = await transaction.user.create({
          data: {
            email: identity.email,
            displayName: identity.displayName,
            avatarUrl: identity.avatarUrl,
            authAccounts: {
              create: {
                provider: "GOOGLE",
                providerSubject: identity.subject,
                verifiedEmail: identity.email,
              },
            },
          },
        });
        const wallet = await transaction.wallet.create({
          data: {
            ownerId: created.id,
            name: "กระเป๋าของฉัน",
            memberships: {
              create: { userId: created.id, role: "OWNER" },
            },
          },
        });
        user = {
          id: created.id,
          email: created.email,
          displayName: created.displayName,
          avatarUrl: created.avatarUrl,
          personalWalletId: wallet.id,
        };
      }

      await transaction.session.create({
        data: { userId: user.id, tokenHash, expiresAt, deviceLabel },
      });
      return user;
    });
  }

  async findSession(tokenHash: string, now: Date) {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: { include: { ownedWallets: { orderBy: { createdAt: "asc" } } } },
      },
    });
    if (!session || session.expiresAt <= now) return null;
    return {
      user: toAuthenticatedUser(session.user),
      expiresAt: session.expiresAt,
    };
  }

  async renewSession(tokenHash: string, now: Date, expiresAt: Date) {
    return this.prisma.$transaction(async (transaction) => {
      // One conditional UPDATE locks the Session row: concurrent renewal cannot
      // shorten expiry, and DELETE cannot be undone by an upsert/recreate.
      const sessions = await transaction.$queryRaw<
        Array<{ userId: string; expiresAt: Date }>
      >`
        UPDATE "Session"
        SET "expiresAt" = GREATEST("expiresAt", ${expiresAt}),
            "lastSeenAt" = GREATEST("lastSeenAt", ${now})
        WHERE "tokenHash" = ${tokenHash} AND "expiresAt" > ${now}
        RETURNING "userId", "expiresAt"
      `;
      const session = sessions[0];
      if (!session) return null;
      const user = await transaction.user.findUniqueOrThrow({
        where: { id: session.userId },
        include: { ownedWallets: { orderBy: { createdAt: "asc" } } },
      });
      return { user: toAuthenticatedUser(user), expiresAt: session.expiresAt };
    });
  }

  async revokeSession(tokenHash: string, now: Date) {
    const result = await this.prisma.session.deleteMany({
      where: { tokenHash, expiresAt: { gt: now } },
    });
    return result.count === 1;
  }

  async authSessionsList(tokenHash: string, now: Date) {
    const current = await this.prisma.session.findFirst({
      where: { tokenHash, expiresAt: { gt: now } },
      select: { userId: true },
    });
    if (!current) return [];
    const sessions = await this.prisma.session.findMany({
      where: { userId: current.userId, expiresAt: { gt: now } },
      orderBy: { lastSeenAt: "desc" },
    });
    return sessions.map((session) => ({
      id: session.id,
      deviceLabel: session.deviceLabel,
      current: session.tokenHash === tokenHash,
      createdAt: session.createdAt.toISOString(),
      lastSeenAt: session.lastSeenAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    }));
  }

  async authSessionRevoke(tokenHash: string, sessionId: string, now: Date) {
    const current = await this.prisma.session.findFirst({
      where: { tokenHash, expiresAt: { gt: now } },
      select: { userId: true },
    });
    if (!current) return false;
    const result = await this.prisma.session.deleteMany({
      where: { id: sessionId, userId: current.userId, expiresAt: { gt: now } },
    });
    return result.count === 1;
  }

  async authSessionsRevokeAll(tokenHash: string, now: Date) {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.session.findFirst({
        where: { tokenHash, expiresAt: { gt: now } },
        select: { userId: true },
      });
      if (!current) return false;
      await transaction.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${current.userId}::uuid FOR UPDATE`;
      await transaction.session.deleteMany({
        where: { userId: current.userId },
      });
      return true;
    });
  }

  async accountDeletionRequest(tokenHash: string, now: Date) {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.session.findFirst({
        where: { tokenHash, expiresAt: { gt: now } },
        include: {
          user: {
            select: { email: true, ownedWallets: { select: { id: true } } },
          },
        },
      });
      if (!current) return false;
      const ownedWalletIds = current.user.ownedWallets.map(({ id }) => id);
      await transaction.user.update({
        where: { id: current.userId },
        data: { pendingDeletionAt: now },
      });
      await transaction.accountDeletionJob.upsert({
        where: { userId: current.userId },
        create: {
          userId: current.userId,
          dueAt: new Date(now.getTime() + 30 * 86400_000),
        },
        update: { dueAt: new Date(now.getTime() + 30 * 86400_000) },
      });
      await Promise.all([
        transaction.session.deleteMany({ where: { userId: current.userId } }),
        transaction.walletMembership.deleteMany({
          where: {
            role: "VIEWER",
            OR: [
              { userId: current.userId },
              { walletId: { in: ownedWalletIds } },
            ],
          },
        }),
        transaction.walletInvitation.updateMany({
          where: {
            status: "PENDING",
            OR: [
              { invitedById: current.userId },
              { email: current.user.email },
              { walletId: { in: ownedWalletIds } },
            ],
          },
          data: { status: "CANCELLED", resolvedAt: now },
        }),
      ]);
      return true;
    });
  }
}
