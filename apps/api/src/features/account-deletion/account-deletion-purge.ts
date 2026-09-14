import type { PrismaClient } from "@prisma/client";

export const ACCOUNT_RECOVERY_MS = 30 * 86400_000;

export async function expiredAccountDeletionProcessNext(
  client: PrismaClient,
  now = new Date(),
) {
  const job = await client.accountDeletionJob.findFirst({
    where: { dueAt: { lte: now } },
    orderBy: { dueAt: "asc" },
  });
  if (!job) return false;
  await client.$transaction(async (transaction) => {
    const deleted = await transaction.user.deleteMany({
      where: {
        id: job.userId,
        pendingDeletionAt: {
          not: null,
          lte: new Date(now.getTime() - ACCOUNT_RECOVERY_MS),
        },
      },
    });
    if (deleted.count === 0)
      await transaction.accountDeletionJob.deleteMany({
        where: { id: job.id },
      });
  });
  return true;
}
