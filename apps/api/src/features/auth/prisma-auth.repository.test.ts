import { randomUUID } from "node:crypto";
import { config as loadEnvironment } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createDatabase,
  type Database,
} from "../../infrastructure/db/database.js";
import { PrismaAuthRepository } from "./prisma-auth.repository.js";

loadEnvironment({ path: new URL("../../../../../.env", import.meta.url) });

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://saving_account:saving_account_local@localhost:5432/saving_account?schema=public";

describe("Prisma authentication persistence", () => {
  let database: Database;
  const suffix = randomUUID();
  const allowedEmail = `allowed-${suffix}@example.com`;
  const rejectedEmail = `rejected-${suffix}@example.com`;

  beforeAll(async () => {
    database = createDatabase(databaseUrl);
    await database.client.betaAllowlist.create({
      data: { email: allowedEmail, addedBy: "integration-test" },
    });
  });

  afterAll(async () => {
    await database.client.user.deleteMany({
      where: { email: { in: [allowedEmail, rejectedEmail] } },
    });
    await database.client.betaAllowlist.deleteMany({
      where: { email: allowedEmail },
    });
    await database.disconnect();
  });

  it("creates one User and Personal Wallet and reuses them on later sign-ins", async () => {
    const repository = new PrismaAuthRepository(database.client);
    const identity = {
      subject: `subject-${suffix}`,
      email: allowedEmail,
      emailVerified: true,
      displayName: "Allowed Friend",
    };

    const first = await repository.createSessionForAllowedIdentity(
      identity,
      `first-${suffix}`,
      new Date(Date.now() + 60_000),
    );
    const second = await repository.createSessionForAllowedIdentity(
      identity,
      `second-${suffix}`,
      new Date(Date.now() + 60_000),
    );

    expect(first).toEqual(second);
    expect(first?.personalWalletId).toEqual(expect.any(String));
    expect(
      await database.client.user.count({ where: { email: allowedEmail } }),
    ).toBe(1);
    expect(
      await database.client.walletMembership.count({
        where: { userId: first!.id, role: "OWNER" },
      }),
    ).toBe(1);
  });

  it("does not persist an ineligible Google identity", async () => {
    const repository = new PrismaAuthRepository(database.client);
    const result = await repository.createSessionForAllowedIdentity(
      {
        subject: `rejected-${suffix}`,
        email: rejectedEmail,
        emailVerified: true,
        displayName: "Rejected Visitor",
      },
      `rejected-token-${suffix}`,
      new Date(Date.now() + 60_000),
    );

    expect(result).toBeNull();
    expect(
      await database.client.user.count({ where: { email: rejectedEmail } }),
    ).toBe(0);
  });
});
