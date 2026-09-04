import { randomUUID } from "node:crypto";
import { config as loadEnvironment } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createDatabase,
  type Database,
} from "../../infrastructure/db/database.js";
import { PrismaBetaWaitlistRepository } from "./beta-waitlist.service.js";

loadEnvironment({ path: new URL("../../../../../.env", import.meta.url) });
const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://saving_account:saving_account_local@localhost:5432/saving_account?schema=public";

describe("Beta Waitlist persistence", () => {
  let database: Database;
  const email = `request-${randomUUID()}@example.com`;
  beforeAll(() => {
    database = createDatabase(databaseUrl);
  });
  afterAll(async () => {
    await database.client.betaWaitlistEntry.deleteMany({ where: { email } });
    await database.disconnect();
  });

  it("stores one normalized request when submitted repeatedly", async () => {
    const repository = new PrismaBetaWaitlistRepository(database.client);
    await repository.requestAccess(email, "2026-09-04");
    await repository.requestAccess(email, "2026-09-04");
    expect(
      await database.client.betaWaitlistEntry.count({ where: { email } }),
    ).toBe(1);
    expect(
      await database.client.betaWaitlistEntry.findUnique({ where: { email } }),
    ).toEqual(
      expect.objectContaining({
        status: "PENDING",
        consentVersion: "2026-09-04",
      }),
    );
  });
});
