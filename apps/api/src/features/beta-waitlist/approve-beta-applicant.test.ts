import { randomUUID } from "node:crypto";
import { config as loadEnvironment } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createDatabase,
  type Database,
} from "../../infrastructure/db/database.js";
import {
  approveBetaApplicant,
  declineBetaApplicant,
  WaitlistEntryAlreadyApprovedError,
  WaitlistEntryDeclinedError,
} from "./approve-beta-applicant.js";

loadEnvironment({ path: new URL("../../../../../.env", import.meta.url) });
const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://saving_account:saving_account_local@localhost:5432/saving_account?schema=public";

describe("Beta Waitlist approval persistence", () => {
  let database: Database;
  const suffix = randomUUID();
  const email = `waitlist-${suffix}@example.com`;
  const declinedEmail = `declined-${suffix}@example.com`;
  const reviewEmail = `review-${suffix}@example.com`;

  beforeAll(async () => {
    database = createDatabase(databaseUrl);
    await database.client.betaWaitlistEntry.createMany({
      data: [
        { email, consentVersion: "2026-09-04" },
        { email: reviewEmail, consentVersion: "2026-09-04" },
        {
          email: declinedEmail,
          consentVersion: "2026-09-04",
          status: "DECLINED",
        },
      ],
    });
  });

  afterAll(async () => {
    await database.client.notificationOutbox.deleteMany({
      where: { recipientEmail: { in: [email, declinedEmail, reviewEmail] } },
    });
    await database.client.betaAllowlist.deleteMany({
      where: { email: { in: [email, declinedEmail, reviewEmail] } },
    });
    await database.client.betaWaitlistEntry.deleteMany({
      where: { email: { in: [email, declinedEmail, reviewEmail] } },
    });
    await database.disconnect();
  });

  it("atomically approves, allows and enqueues only once", async () => {
    await approveBetaApplicant(
      database.client,
      email.toUpperCase(),
      "integration-test",
    );
    await approveBetaApplicant(database.client, email, "another-reviewer");

    expect(
      await database.client.betaWaitlistEntry.findUnique({ where: { email } }),
    ).toEqual(
      expect.objectContaining({
        status: "APPROVED",
        reviewedBy: "integration-test",
      }),
    );
    expect(
      await database.client.betaAllowlist.count({ where: { email } }),
    ).toBe(1);
    expect(
      await database.client.notificationOutbox.count({
        where: { recipientEmail: email },
      }),
    ).toBe(1);
  });

  it("does not promote a declined request", async () => {
    await expect(
      approveBetaApplicant(database.client, declinedEmail, "integration-test"),
    ).rejects.toBeInstanceOf(WaitlistEntryDeclinedError);
    expect(
      await database.client.betaAllowlist.count({
        where: { email: declinedEmail },
      }),
    ).toBe(0);
  });

  it("declines idempotently and refuses to reverse an approval", async () => {
    await declineBetaApplicant(
      database.client,
      reviewEmail,
      "integration-test",
    );
    await declineBetaApplicant(
      database.client,
      reviewEmail,
      "another-reviewer",
    );
    expect(
      await database.client.betaWaitlistEntry.findUnique({
        where: { email: reviewEmail },
      }),
    ).toEqual(
      expect.objectContaining({
        status: "DECLINED",
        reviewedBy: "integration-test",
      }),
    );
    await expect(
      declineBetaApplicant(database.client, email, "integration-test"),
    ).rejects.toBeInstanceOf(WaitlistEntryAlreadyApprovedError);
  });
});
