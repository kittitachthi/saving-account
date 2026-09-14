import { config as loadEnvironment } from "dotenv";
import { z } from "zod";
import { betaResetTargetAssert } from "../features/beta-reset/beta-reset-guard.js";
import {
  betaResetBackupDeleteAfterCalculate,
  betaResetNotificationsSchedule,
} from "../features/beta-reset/beta-reset-notifications.js";
import { createDatabase } from "../infrastructure/db/database.js";

loadEnvironment({ path: new URL("../../../../.env", import.meta.url) });
betaResetTargetAssert(process.env);
const resetAt = z.coerce.date().parse(process.argv[2]);
const database = createDatabase(process.env.DATABASE_URL!);
try {
  const result = await betaResetNotificationsSchedule(database.client, resetAt);
  process.stdout.write(
    `Scheduled ${result.count} notifications. Backup deletion after ${betaResetBackupDeleteAfterCalculate(resetAt).toISOString()}\n`,
  );
} finally {
  await database.disconnect();
}
