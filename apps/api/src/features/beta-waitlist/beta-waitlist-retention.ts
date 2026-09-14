import type { PrismaClient } from "@prisma/client";

export const BETA_WAITLIST_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;

export async function betaWaitlistExpiredEntriesDelete(
  client: PrismaClient,
  now = new Date(),
) {
  const result = await client.betaWaitlistEntry.deleteMany({
    where: {
      status: { in: ["PENDING", "DECLINED"] },
      requestedAt: {
        lte: new Date(now.getTime() - BETA_WAITLIST_RETENTION_MS),
      },
    },
  });
  return result.count;
}
