import { config as loadEnvironment } from "dotenv";
import { z } from "zod";
import { approveBetaApplicant } from "../features/beta-waitlist/approve-beta-applicant.js";
import { createDatabase } from "../infrastructure/db/database.js";

loadEnvironment({ path: new URL("../../../../.env", import.meta.url) });

const input = z.object({
  email: z.string().trim().toLowerCase().email(),
  reviewedBy: z.string().trim().min(1),
  databaseUrl: z.string().startsWith("postgresql://"),
});
const parsed = input.safeParse({
  email: process.argv[2],
  reviewedBy: process.argv[3],
  databaseUrl: process.env.DATABASE_URL,
});
if (!parsed.success) {
  throw new Error("Usage: npm run beta:approve -- <email> <reviewed-by>");
}

const database = createDatabase(parsed.data.databaseUrl);
try {
  const approved = await approveBetaApplicant(
    database.client,
    parsed.data.email,
    parsed.data.reviewedBy,
  );
  process.stdout.write(`Approved beta request: ${approved.email}\n`);
} finally {
  await database.disconnect();
}
