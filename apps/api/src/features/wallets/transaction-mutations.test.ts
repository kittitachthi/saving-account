import { createHash, randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { createDatabase } from "../../infrastructure/db/database.js";
import { AuthService } from "../auth/auth.service.js";
import { PrismaAuthRepository } from "../auth/prisma-auth.repository.js";
import { privacyNotice } from "../privacy/privacy-notice.js";
import { WalletRepository } from "./wallet.repository.js";
import { registerWalletRoutes } from "./wallet.routes.js";

describe("transaction edits, deletion and timed Undo through HTTP/PostgreSQL", () => {
  const db = createDatabase(
    process.env.TEST_DATABASE_URL ??
      "postgresql://saving_account:saving_account_local@localhost:5432/saving_account?schema=public",
  );
  const trusted = { Origin: "http://localhost:5173", "X-Pocka-Request": "1" };
  const token = randomUUID();
  const cookie = `saving_account_session=${token}`;
  let userId: string;
  let walletId: string;
  let clock: number;
  const auth = new AuthService(
    new PrismaAuthRepository(db.client),
    {
      createAuthorizationRequest: async () => {
        throw new Error("unused");
      },
      consumeAuthorizationResponse: async () => {
        throw new Error("unused");
      },
    },
    () => new Date(clock),
  );
  const app = createApp({
    checkDatabase: () => db.checkConnection(),
    registerRoutes: (app) =>
      registerWalletRoutes(
        app,
        auth,
        new WalletRepository(db.client, privacyNotice.version),
        trusted.Origin,
        privacyNotice,
        () => new Date(clock),
      ),
  });
  const path = (id?: string) =>
    `/api/wallets/${walletId}${id ? `/transactions/${id}` : ""}`;
  const create = async (type: string, amount: number) =>
    (
      await request(app)
        .post(`${path()}/transactions`)
        .set(trusted)
        .set("Cookie", cookie)
        .send({
          operationId: randomUUID(),
          title: type,
          category: "ทดสอบ",
          type,
          amount,
          occurredOn: "2026-09-09",
          occurredTime: null,
        })
        .expect(201)
    ).body;
  const edit = (
    row: {
      title: string;
      category: string;
      amount: number;
      occurredOn: string;
      occurredTime: string | null;
      updatedAt: string;
    },
    extra = {},
  ) => ({
    title: row.title,
    category: row.category,
    amount: row.amount,
    occurredOn: row.occurredOn,
    occurredTime: row.occurredTime,
    expectedUpdatedAt: row.updatedAt,
    ...extra,
  });
  const deletion = (row: { updatedAt: string }) => ({
    operationId: randomUUID(),
    expectedUpdatedAt: row.updatedAt,
  });
  const snapshot = async () =>
    (await request(app).get(path()).set("Cookie", cookie).expect(200)).body;
  beforeAll(async () => {
    const user = await db.client.user.create({
      data: {
        email: `mutations-${randomUUID()}@example.com`,
        displayName: "Tester",
        sessions: {
          create: {
            tokenHash: createHash("sha256").update(token).digest("hex"),
            expiresAt: new Date("2030-01-01"),
          },
        },
        privacyAcceptances: { create: { version: privacyNotice.version } },
      },
    });
    userId = user.id;
  });
  beforeEach(async () => {
    clock = Date.parse("2026-09-09T00:00:00Z");
    const wallet = await db.client.wallet.create({
      data: {
        ownerId: userId,
        name: "Test",
        memberships: { create: { userId, role: "OWNER" } },
      },
    });
    walletId = wallet.id;
  });
  afterAll(async () => {
    await db.client.user.deleteMany({ where: { id: userId } });
    await db.disconnect();
  });

  it("edits all allowed fields, preserves creation time and rejects stale edits from another device", async () => {
    const row = await create("income", 10000);
    const updated = await request(app)
      .patch(path(row.id))
      .set(trusted)
      .set("Cookie", cookie)
      .send(
        edit(row, {
          title: "แก้แล้ว",
          category: "รายได้เสริม",
          amount: 12345,
          occurredOn: "2026-08-31",
          occurredTime: "23:59",
        }),
      )
      .expect(200);
    expect(updated.body).toMatchObject({
      title: "แก้แล้ว",
      amount: 12345,
      createdAt: row.createdAt,
      occurredTime: "23:59",
    });
    expect(Date.parse(updated.body.updatedAt)).toBeGreaterThan(
      Date.parse(row.updatedAt),
    );
    expect((await snapshot()).totals.income).toBe(12345);
    expect((await snapshot()).monthly.income).toBe(0);
    await request(app)
      .patch(path(row.id))
      .set(trusted)
      .set("Cookie", cookie)
      .send(edit(row))
      .expect(409);
    for (const fields of [
      { amount: 1.1 },
      { occurredOn: "2026-02-30" },
      { occurredTime: "24:00" },
      { title: " " },
      { createdAt: row.createdAt },
      { type: "expense" },
    ])
      await request(app)
        .patch(path(row.id))
        .set(trusted)
        .set("Cookie", cookie)
        .send(edit(updated.body, fields))
        .expect(400);
  });

  it("protects edit/delete/restore with authentication, CSRF, consent and owner membership", async () => {
    const row = await create("income", 10000);
    const cases = () => [
      request(app).patch(path(row.id)).send(edit(row)),
      request(app).delete(path(row.id)).send(deletion(row)),
      request(app)
        .post(`${path(row.id)}/restore`)
        .send({ operationId: randomUUID() }),
    ];
    for (const call of cases()) await call.set(trusted).expect(401);
    for (const call of cases()) await call.set("Cookie", cookie).expect(403);
    await db.client.walletMembership.update({
      where: { walletId_userId: { walletId, userId } },
      data: { role: "VIEWER" },
    });
    for (const call of cases())
      await call.set(trusted).set("Cookie", cookie).expect(403);
    await db.client.walletMembership.update({
      where: { walletId_userId: { walletId, userId } },
      data: { role: "OWNER" },
    });
    await db.client.privacyAcceptance.delete({
      where: { userId_version: { userId, version: privacyNotice.version } },
    });
    for (const call of cases())
      await call.set(trusted).set("Cookie", cookie).expect(403);
    await db.client.privacyAcceptance.create({
      data: { userId, version: privacyNotice.version },
    });
    const foreign = await db.client.wallet.create({
      data: {
        ownerId: userId,
        name: "Other",
        memberships: { create: { userId, role: "OWNER" } },
      },
    });
    walletId = foreign.id;
    for (const call of cases())
      await call.set(trusted).set("Cookie", cookie).expect(409);
  });

  it("serializes edits and spending; prevents negative balances and double writes", async () => {
    const income = await create("income", 10000);
    const expense = await create("expense", 6000);
    await request(app)
      .patch(path(income.id))
      .set(trusted)
      .set("Cookie", cookie)
      .send(edit(income, { amount: 5000 }))
      .expect(409);
    await request(app)
      .delete(path(income.id))
      .set(trusted)
      .set("Cookie", cookie)
      .send(deletion(income))
      .expect(409);
    const results = await Promise.all(
      [8000, 9000].map((amount) =>
        request(app)
          .patch(path(expense.id))
          .set(trusted)
          .set("Cookie", cookie)
          .send(edit(expense, { amount })),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect((await snapshot()).totals.balance).toBeGreaterThanOrEqual(0);
  });

  it("deletes immediately, retries without extending the deadline, and restores exactly once", async () => {
    await create("income", 10000);
    const row = await create("saving", 1234);
    const input = deletion(row);
    const removed = await request(app)
      .delete(path(row.id))
      .set(trusted)
      .set("Cookie", cookie)
      .send(input)
      .expect(200);
    expect((await snapshot()).totals.saving).toBe(0);
    expect((await snapshot()).transactions).toHaveLength(1);
    clock += 4999;
    const retry = await request(app)
      .delete(path(row.id))
      .set(trusted)
      .set("Cookie", cookie)
      .send(input)
      .expect(200);
    expect(retry.body.undoUntil).toBe(removed.body.undoUntil);
    await request(app)
      .post(`${path(row.id)}/restore`)
      .set(trusted)
      .set("Cookie", cookie)
      .send({ operationId: input.operationId })
      .expect(204);
    clock += 10000;
    await request(app)
      .post(`${path(row.id)}/restore`)
      .set(trusted)
      .set("Cookie", cookie)
      .send({ operationId: input.operationId })
      .expect(204);
    expect((await snapshot()).totals.saving).toBe(1234);
    const restored = (await snapshot()).transactions.find(
      (item: { id: string }) => item.id === row.id,
    );
    expect(restored.createdAt).toBe(row.createdAt);
    await request(app)
      .delete(path(row.id))
      .set(trusted)
      .set("Cookie", cookie)
      .send(deletion(restored))
      .expect(200);
    await request(app)
      .post(`${path(row.id)}/restore`)
      .set(trusted)
      .set("Cookie", cookie)
      .send({ operationId: input.operationId })
      .expect(409);
  });

  it("serializes balance changes across different rows and preserves safe-integer totals on restore", async () => {
    await create("income", 10000);
    const expense = await create("expense", 1000);
    const saving = await create("saving", 1000);
    const results = await Promise.all(
      [expense, saving].map((row) =>
        request(app)
          .patch(path(row.id))
          .set(trusted)
          .set("Cookie", cookie)
          .send(edit(row, { amount: 8000 })),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect((await snapshot()).totals.balance).toBe(1000);
    const largeWallet = await db.client.wallet.create({
      data: {
        ownerId: userId,
        name: "Large",
        memberships: { create: { userId, role: "OWNER" } },
      },
    });
    walletId = largeWallet.id;
    const income = await create("income", 1);
    const input = deletion(income);
    await request(app)
      .delete(path(income.id))
      .set(trusted)
      .set("Cookie", cookie)
      .send(input)
      .expect(200);
    await create("income", Number.MAX_SAFE_INTEGER);
    const restore = await request(app)
      .post(`${path(income.id)}/restore`)
      .set(trusted)
      .set("Cookie", cookie)
      .send({ operationId: input.operationId })
      .expect(409);
    expect(restore.body.error.code).toBe("AMOUNT_LIMIT");
    expect((await snapshot()).totals.income).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("rejects Undo at the server deadline and when another device spent the freed balance", async () => {
    await create("income", 10000);
    const row = await create("expense", 7000);
    const input = deletion(row);
    await request(app)
      .delete(path(row.id))
      .set(trusted)
      .set("Cookie", cookie)
      .send(input)
      .expect(200);
    await create("saving", 8000);
    const failed = await request(app)
      .post(`${path(row.id)}/restore`)
      .set(trusted)
      .set("Cookie", cookie)
      .send({ operationId: input.operationId })
      .expect(409);
    expect(failed.body.error.code).toBe("INSUFFICIENT_BALANCE");
    clock += 5000;
    const expired = await request(app)
      .post(`${path(row.id)}/restore`)
      .set(trusted)
      .set("Cookie", cookie)
      .send({ operationId: input.operationId })
      .expect(409);
    expect(expired.body.error.code).toBe("UNDO_EXPIRED");
    expect((await snapshot()).totals).toEqual({
      income: 10000,
      expense: 0,
      saving: 8000,
      balance: 2000,
    });
  });
});
