import type { PrismaClient } from "@prisma/client";

export const CURRENT_WAITLIST_CONSENT_VERSION = "2026-09-04";

export type BetaWaitlistRepository = {
  requestAccess(email: string, consentVersion: string): Promise<void>;
  betaWaitlistWithdrawalRequest(
    email: string,
    tokenHash: string,
    withdrawalUrl: string,
    expiresAt: Date,
  ): Promise<void>;
  betaWaitlistWithdrawalConsume(tokenHash: string, now: Date): Promise<void>;
};

export class BetaWaitlistService {
  constructor(private readonly repository: BetaWaitlistRepository) {}

  async requestAccess(email: string, consentVersion: string) {
    await this.repository.requestAccess(
      email.trim().toLowerCase(),
      consentVersion,
    );
  }

  async betaWaitlistWithdrawalRequest(
    email: string,
    tokenHash: string,
    withdrawalUrl: string,
    expiresAt: Date,
  ) {
    await this.repository.betaWaitlistWithdrawalRequest(
      email.trim().toLowerCase(),
      tokenHash,
      withdrawalUrl,
      expiresAt,
    );
  }

  async betaWaitlistWithdrawalConsume(tokenHash: string, now = new Date()) {
    await this.repository.betaWaitlistWithdrawalConsume(tokenHash, now);
  }
}

export class PrismaBetaWaitlistRepository implements BetaWaitlistRepository {
  constructor(private readonly client: PrismaClient) {}

  async requestAccess(email: string, consentVersion: string) {
    await this.client.betaWaitlistEntry.upsert({
      where: { email },
      create: { email, consentVersion },
      update: {},
    });
  }

  async betaWaitlistWithdrawalRequest(
    email: string,
    tokenHash: string,
    withdrawalUrl: string,
    expiresAt: Date,
  ) {
    await this.client.$transaction(async (transaction) => {
      const entry = await transaction.betaWaitlistEntry.findUnique({
        where: { email },
      });
      if (!entry || !["PENDING", "DECLINED"].includes(entry.status)) return;
      await transaction.betaWaitlistWithdrawal.upsert({
        where: { email },
        create: { email, tokenHash, expiresAt },
        update: { tokenHash, expiresAt, consumedAt: null },
      });
      await transaction.notificationOutbox.create({
        data: {
          kind: "WAITLIST_WITHDRAWAL",
          dedupeKey: `waitlist-withdrawal:${tokenHash}`,
          recipientEmail: email,
          payload: { withdrawalUrl },
        },
      });
    });
  }

  async betaWaitlistWithdrawalConsume(tokenHash: string, now: Date) {
    await this.client.$transaction(async (transaction) => {
      const withdrawal = await transaction.betaWaitlistWithdrawal.findUnique({
        where: { tokenHash },
      });
      if (!withdrawal || withdrawal.consumedAt || withdrawal.expiresAt <= now)
        return;
      await transaction.betaWaitlistEntry.deleteMany({
        where: {
          email: withdrawal.email,
          status: { in: ["PENDING", "DECLINED"] },
        },
      });
      await transaction.betaWaitlistWithdrawal.update({
        where: { id: withdrawal.id },
        data: { consumedAt: now },
      });
    });
  }
}
