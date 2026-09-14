import type { PrismaClient } from "@prisma/client";

export const BETA_RESET_NOTICE_MS = 14 * 86400_000;
export const BETA_RESET_REMINDER_MS = 3 * 86400_000;
export const BETA_RESET_BACKUP_RETENTION_MS = 30 * 86400_000;

export async function betaResetNotificationsSchedule(
  client: PrismaClient,
  resetAt: Date,
  now = new Date(),
) {
  if (resetAt.getTime() - now.getTime() < BETA_RESET_NOTICE_MS)
    throw new Error("Beta reset requires at least 14 days notice");
  const users = await client.user.findMany({ select: { email: true } });
  const resetKey = resetAt.toISOString();
  return client.notificationOutbox.createMany({
    data: users.flatMap(({ email }) => [
      {
        kind: "BETA_RESET_NOTICE" as const,
        dedupeKey: `beta-reset:${resetKey}:notice:${email}`,
        recipientEmail: email,
        payload: { resetAt: resetKey, phase: "notice" },
        nextAttemptAt: new Date(resetAt.getTime() - BETA_RESET_NOTICE_MS),
      },
      {
        kind: "BETA_RESET_NOTICE" as const,
        dedupeKey: `beta-reset:${resetKey}:reminder:${email}`,
        recipientEmail: email,
        payload: { resetAt: resetKey, phase: "reminder" },
        nextAttemptAt: new Date(resetAt.getTime() - BETA_RESET_REMINDER_MS),
      },
    ]),
    skipDuplicates: true,
  });
}

export const betaResetBackupDeleteAfterCalculate = (resetAt: Date) =>
  new Date(resetAt.getTime() + BETA_RESET_BACKUP_RETENTION_MS);
