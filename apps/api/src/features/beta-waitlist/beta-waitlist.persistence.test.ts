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
  const withdrawalEmail = `withdraw-${email}`;
  beforeAll(() => {
    database = createDatabase(databaseUrl);
  });
  afterAll(async () => {
    await database.client.notificationOutbox.deleteMany({
      where: { recipientEmail: withdrawalEmail },
    });
    await database.client.betaWaitlistWithdrawal.deleteMany({
      where: { email: withdrawalEmail },
    });
    await database.client.betaWaitlistEntry.deleteMany({
      where: { email: { in: [email, withdrawalEmail] } },
    });
    await database.disconnect();
  });

  it("consumes a withdrawal once without changing approved access", async () => {
    const repository = new PrismaBetaWaitlistRepository(database.client);
    await repository.requestAccess(withdrawalEmail, "2026-09-04");
    const expiresAt = new Date(Date.now() + 60_000);
    await repository.betaWaitlistWithdrawalRequest(
      withdrawalEmail,
      "hash-1",
      "https://pocka.test/withdraw",
      expiresAt,
    );
    expect(
      await database.client.betaWaitlistWithdrawal.count({
        where: { email: withdrawalEmail },
      }),
    ).toBe(1);
    await repository.betaWaitlistWithdrawalConsume("hash-1", new Date());
    await repository.betaWaitlistWithdrawalConsume("hash-1", new Date());
    expect(
      await database.client.betaWaitlistEntry.findUnique({
        where: { email: withdrawalEmail },
      }),
    ).toBeNull();

    await repository.requestAccess(withdrawalEmail, "2026-09-04");
    await database.client.betaWaitlistEntry.update({
      where: { email: withdrawalEmail },
      data: { status: "APPROVED" },
    });
    await repository.betaWaitlistWithdrawalRequest(
      withdrawalEmail,
      "hash-2",
      "https://pocka.test/withdraw-2",
      expiresAt,
    );
    expect(
      await database.client.betaWaitlistWithdrawal.findUnique({
        where: { tokenHash: "hash-2" },
      }),
    ).toBeNull();
    expect(
      (
        await database.client.betaWaitlistEntry.findUniqueOrThrow({
          where: { email: withdrawalEmail },
        })
      ).status,
    ).toBe("APPROVED");
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
