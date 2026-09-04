import { config as loadEnvironment } from "dotenv";
import { z } from "zod";
import { createDatabase } from "../infrastructure/db/database.js";

loadEnvironment({ path: new URL("../../../../.env", import.meta.url) });

const input = z.object({
  email: z.string().trim().toLowerCase().email(),
  addedBy: z.string().trim().min(1),
  databaseUrl: z.string().startsWith("postgresql://"),
});

const parsed = input.safeParse({
  email: process.argv[2],
  addedBy: process.argv[3],
  databaseUrl: process.env.DATABASE_URL,
});
if (!parsed.success) {
  throw new Error("Usage: npm run beta:allow -- <email> <added-by>");
}

const database = createDatabase(parsed.data.databaseUrl);
try {
  await database.client.betaAllowlist.upsert({
    where: { email: parsed.data.email },
    create: { email: parsed.data.email, addedBy: parsed.data.addedBy },
    update: {},
  });
  process.stdout.write(`Allowed beta account: ${parsed.data.email}\n`);
} finally {
  await database.disconnect();
}
