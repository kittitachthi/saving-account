import type { PrismaClient } from "@prisma/client";

export const CURRENT_WAITLIST_CONSENT_VERSION = "2026-09-04";

export type BetaWaitlistRepository = {
  requestAccess(email: string, consentVersion: string): Promise<void>;
};

export class BetaWaitlistService {
  constructor(private readonly repository: BetaWaitlistRepository) {}

  async requestAccess(email: string, consentVersion: string) {
    await this.repository.requestAccess(
      email.trim().toLowerCase(),
      consentVersion,
    );
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
}
