import { config as loadEnvironment } from "dotenv";
import { z } from "zod";
import { expiredAccountDeletionProcessNext } from "../features/account-deletion/account-deletion-purge.js";
import { createDatabase } from "../infrastructure/db/database.js";

loadEnvironment({ path: new URL("../../../../.env", import.meta.url) });
const databaseUrl = z
  .string()
  .startsWith("postgresql://")
  .parse(process.env.DATABASE_URL);
const database = createDatabase(databaseUrl);
try {
  let count = 0;
  while (await expiredAccountDeletionProcessNext(database.client)) count++;
  process.stdout.write(`Processed expired Account deletions: ${count}\n`);
} finally {
  await database.disconnect();
}
