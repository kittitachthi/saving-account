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

      let user: AuthenticatedUser;
      if (account) {
        const updated = await transaction.user.update({
          where: { id: account.userId },
          data: {
            displayName: identity.displayName,
            email: identity.email,
            avatarUrl: identity.avatarUrl,
          },
          include: { ownedWallets: { orderBy: { createdAt: "asc" } } },
        });
        user = toAuthenticatedUser(updated);
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
        data: { userId: user.id, tokenHash, expiresAt },
      });
      return user;
    });
  }

  async findUserBySession(tokenHash: string, now: Date) {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: { include: { ownedWallets: { orderBy: { createdAt: "asc" } } } },
      },
    });
    if (!session || session.expiresAt <= now) return null;
    return toAuthenticatedUser(session.user);
  }

  async revokeSession(tokenHash: string) {
    await this.prisma.session.deleteMany({ where: { tokenHash } });
  }
}
