import { config as loadEnvironment } from "dotenv";
import { z } from "zod";
import { betaWaitlistExpiredEntriesDelete } from "../features/beta-waitlist/beta-waitlist-retention.js";
import { createDatabase } from "../infrastructure/db/database.js";

loadEnvironment({ path: new URL("../../../../.env", import.meta.url) });

const databaseUrl = z
  .string()
  .startsWith("postgresql://")
  .parse(process.env.DATABASE_URL);
const database = createDatabase(databaseUrl);
try {
  const count = await betaWaitlistExpiredEntriesDelete(database.client);
  process.stdout.write(`Deleted expired beta Waitlist entries: ${count}\n`);
} finally {
  await database.disconnect();
}
