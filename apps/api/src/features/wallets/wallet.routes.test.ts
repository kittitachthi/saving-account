import { createHash, randomUUID } from "node:crypto";
import { config as loadEnvironment } from "dotenv";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import {
  createDatabase,
  type Database,
} from "../../infrastructure/db/database.js";
import { AuthService } from "../auth/auth.service.js";
import { PrismaAuthRepository } from "../auth/prisma-auth.repository.js";
import { registerAuthRoutes } from "../auth/auth.routes.js";
import { privacyNotice } from "../privacy/privacy-notice.js";
import { walletRoutesRegister } from "./wallet.routes.js";
import { WalletRepository } from "./wallet.repository.js";

loadEnvironment({ path: new URL("../../../../../.env", import.meta.url) });
const trusted = { Origin: "http://localhost:5173", "X-Pocka-Request": "1" };
const now = new Date("2026-08-31T17:00:00Z");
describe("online Personal Wallet through HTTP and PostgreSQL", () => {
  let db: Database;
  let app: ReturnType<typeof createApp>;
  let changedNoticeApp: ReturnType<typeof createApp>;
  const ids: string[] = [];
  const cookies: string[] = [];
  const wallets: string[] = [];
  const walletPathBuild = () => `/api/wallets/${wallets[0]}`;
  const walletTransactionRequestBodyBuild = (
    type = "income",
    amount = 10000,
    extra = {},
  ) => ({
    operationId: randomUUID(),
    title: "รายการทดสอบ",
    category: "อาหาร",
    type,
    amount,
    occurredOn: "2026-09-01",
    occurredTime: null,
    ...extra,
  });
  beforeAll(async () => {
    db = createDatabase(
      process.env.TEST_DATABASE_URL ??
        "postgresql://saving_account:saving_account_local@localhost:5432/saving_account?schema=public",
    );
    for (let i = 0; i < 3; i++) {
      const token = randomUUID();
      const user = await db.client.user.create({
        data: {
          email: `wallet-${randomUUID()}@example.com`,
          displayName: "Wallet tester",
          sessions: {
            create: {
              tokenHash: createHash("sha256").update(token).digest("hex"),
              expiresAt: new Date("2030-01-01"),
            },
          },
        },
      });
      const wallet = await db.client.wallet.create({
        data: {
          ownerId: user.id,
          name: "กระเป๋าของฉัน",
          memberships: { create: { userId: user.id, role: "OWNER" } },
        },
      });
      ids.push(user.id);
      wallets.push(wallet.id);
      cookies.push(`saving_account_session=${token}`);
    }
    const auth = new AuthService(
      new PrismaAuthRepository(db.client),
      {
        createAuthorizationRequest: async () => {
          throw new Error("not used");
        },
        consumeAuthorizationResponse: async () => {
          throw new Error("not used");
        },
      },
      () => now,
    );
    const walletTestApplicationCompose = (version: string) =>
      createApp({
        checkDatabase: () => db.checkConnection(),
        registerRoutes: (application) => {
          registerAuthRoutes(application, auth, {
            appOrigin: trusted.Origin,
            googleRedirectUri: `${trusted.Origin}/api/auth/google/callback`,
            secureCookies: false,
          });
          walletRoutesRegister(
            application,
            auth,
            new WalletRepository(db.client, version),
            trusted.Origin,
            { ...privacyNotice, version },
            () => now,
          );
        },
      });
    app = walletTestApplicationCompose(privacyNotice.version);
    changedNoticeApp = walletTestApplicationCompose("2026-09-09");
  });
  afterAll(async () => {
    await db.client.user.deleteMany({ where: { id: { in: ids } } });
    await db.disconnect();
  });

  it("gates finances until current consent, records consent once and re-gates material changes", async () => {
    await request(app).get(walletPathBuild()).expect(401);
    const notice = await request(app)
      .get("/api/privacy")
      .set("Cookie", cookies[0])
      .expect(200);
    expect(notice.body.accepted).toBe(false);
    expect(notice.body.paragraphs.length).toBeGreaterThan(0);
    await request(app)
      .get(walletPathBuild())
      .set("Cookie", cookies[0])
      .expect(403);
    await request(app)
      .post(`${walletPathBuild()}/transactions`)
      .set(trusted)
      .set("Cookie", cookies[0])
      .send(walletTransactionRequestBodyBuild())
      .expect(403);
    await request(app)
      .put(`${walletPathBuild()}/savings-goal`)
      .set(trusted)
      .set("Cookie", cookies[0])
      .send({ amount: 100 })
      .expect(403);
    await request(app)
      .get("/api/auth/session")
      .set("Cookie", cookies[0])
      .expect(200);
    await request(app)
      .post("/api/privacy/accept")
      .set("Cookie", cookies[0])
      .send({ version: privacyNotice.version })
      .expect(403);
    await request(app)
      .post("/api/privacy/accept")
      .set(trusted)
      .set("Cookie", cookies[0])
      .send({ version: "old" })
      .expect(409);
    for (const cookie of cookies)
      await request(app)
        .post("/api/privacy/accept")
        .set(trusted)
        .set("Cookie", cookie)
        .send({ version: privacyNotice.version })
        .expect(204);
    const acceptance = await db.client.privacyAcceptance.findMany({
      where: { userId: ids[0] },
    });
    await request(app)
      .post("/api/privacy/accept")
      .set(trusted)
      .set("Cookie", cookies[0])
      .send({ version: privacyNotice.version })
      .expect(204);
    expect(
      await db.client.privacyAcceptance.findMany({ where: { userId: ids[0] } }),
    ).toEqual(acceptance);
    const denied = await request(changedNoticeApp)
      .get(walletPathBuild())
      .set("Cookie", cookies[0])
      .expect(403);
    expect(denied.body.error.code).toBe("PRIVACY_REQUIRED");
    expect(
      (
        await request(changedNoticeApp)
          .get("/api/privacy")
          .set("Cookie", cookies[0])
      ).body.accepted,
    ).toBe(false);
    const empty = await request(app)
      .get(walletPathBuild())
      .set("Cookie", cookies[0])
      .expect(200);
    expect(empty.body.transactions).toEqual([]);
    expect(empty.body.goal).toBeNull();
    expect(empty.headers["cache-control"]).toBe("no-store");
  });

  it("allows Viewer reads but checks Owner membership on every write", async () => {
    await db.client.walletMembership.create({
      data: { walletId: wallets[0], userId: ids[1], role: "VIEWER" },
    });
    for (const [index, cookie] of [cookies[1], cookies[2]].entries()) {
      await request(app)
        .get(walletPathBuild())
        .set("Cookie", cookie)
        .expect(index === 0 ? 200 : 403);
      await request(app)
        .post(`${walletPathBuild()}/transactions`)
        .set(trusted)
        .set("Cookie", cookie)
        .send(walletTransactionRequestBodyBuild())
        .expect(403);
      await request(app)
        .put(`${walletPathBuild()}/savings-goal`)
        .set(trusted)
        .set("Cookie", cookie)
        .send({ amount: 100 })
        .expect(403);
    }
    const extra = await db.client.wallet.create({
      data: {
        ownerId: ids[0],
        name: "Second",
        memberships: { create: { userId: ids[0], role: "OWNER" } },
      },
    });
    await request(app)
      .post(`/api/wallets/${extra.id}/transactions`)
      .set(trusted)
      .set("Cookie", cookies[0])
      .send(walletTransactionRequestBodyBuild())
      .expect(201);
    expect(
      (await request(app).get(walletPathBuild()).set("Cookie", cookies[0])).body
        .totals.income,
    ).toBe(0);
    await db.client.walletMembership.delete({
      where: { walletId_userId: { walletId: extra.id, userId: ids[0] } },
    });
    await request(app)
      .get(`/api/wallets/${extra.id}`)
      .set("Cookie", cookies[0])
      .expect(403);
  });

  it("validates exact money and calendar dates and rejects CSRF before writing", async () => {
    for (const extra of [
      { amount: 0 },
      { amount: -1 },
      { amount: 0.1 },
      { amount: Number.MAX_SAFE_INTEGER + 1 },
      { occurredOn: "2026-02-30" },
      { occurredTime: "25:00" },
      { title: " " },
      { createdAt: now.toISOString() },
    ]) {
      await request(app)
        .post(`${walletPathBuild()}/transactions`)
        .set(trusted)
        .set("Cookie", cookies[0])
        .send(walletTransactionRequestBodyBuild("income", 100, extra))
        .expect(400);
    }
    await request(app)
      .post(`${walletPathBuild()}/transactions`)
      .set("Cookie", cookies[0])
      .send(walletTransactionRequestBodyBuild())
      .expect(403);
    await request(app)
      .put(`${walletPathBuild()}/savings-goal`)
      .set("Cookie", cookies[0])
      .send({ amount: 100 })
      .expect(403);
    await request(app)
      .get(`${walletPathBuild()}?page=-1`)
      .set("Cookie", cookies[0])
      .expect(400);
  });

  it("persists exact totals, deterministic pages, nullable time and shared savings goals across sessions", async () => {
    const original = walletTransactionRequestBodyBuild("income", 10000, {
      occurredOn: "2026-08-31",
    });
    const created = await request(app)
      .post(`${walletPathBuild()}/transactions`)
      .set(trusted)
      .set("Cookie", cookies[0])
      .send(original)
      .expect(201);
    const duplicate = await request(app)
      .post(`${walletPathBuild()}/transactions`)
      .set(trusted)
      .set("Cookie", cookies[0])
      .send(original)
      .expect(201);
    expect(duplicate.body).toEqual(created.body);
    await request(app)
      .post(`${walletPathBuild()}/transactions`)
      .set(trusted)
      .set("Cookie", cookies[0])
      .send({ ...original, amount: 1 })
      .expect(409);
    for (let i = 0; i < 11; i++)
      await request(app)
        .post(`${walletPathBuild()}/transactions`)
        .set(trusted)
        .set("Cookie", cookies[0])
        .send(
          walletTransactionRequestBodyBuild("income", 1, {
            title: `small-${i}`,
            occurredTime: "09:00",
          }),
        )
        .expect(201);
    await request(app)
      .post(`${walletPathBuild()}/transactions`)
      .set(trusted)
      .set("Cookie", cookies[0])
      .send(walletTransactionRequestBodyBuild("expense", 11))
      .expect(201);
    await request(app)
      .post(`${walletPathBuild()}/transactions`)
      .set(trusted)
      .set("Cookie", cookies[0])
      .send(
        walletTransactionRequestBodyBuild("saving", 1000, {
          category: "ท่องเที่ยว",
        }),
      )
      .expect(201);
    await request(app)
      .put(`${walletPathBuild()}/savings-goal`)
      .set(trusted)
      .set("Cookie", cookies[0])
      .send({ amount: 3000 })
      .expect(204);
    await request(app)
      .put(`${walletPathBuild()}/savings-goal`)
      .set(trusted)
      .set("Cookie", cookies[0])
      .send({ amount: 2000 })
      .expect(204);
    const token = randomUUID();
    await db.client.session.create({
      data: {
        userId: ids[0],
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date("2030-01-01"),
      },
    });
    const otherDevice = `saving_account_session=${token}`;
    const walletSnapshot = (
      await request(app)
        .get(walletPathBuild())
        .set("Cookie", otherDevice)
        .expect(200)
    ).body;
    expect(walletSnapshot.totals).toEqual({
      income: 10011,
      expense: 11,
      saving: 1000,
      balance: 9000,
    });
    expect(walletSnapshot.monthly).toEqual({
      income: 11,
      expense: 11,
      saving: 1000,
    });
    expect(walletSnapshot.today).toBe("2026-09-01");
    expect(walletSnapshot.goal).toBe(2000);
    expect(walletSnapshot.savingsCategories).toEqual([
      { name: "ท่องเที่ยว", total: 1000, count: 1, average: 1000 },
    ]);
    expect(walletSnapshot.transactions).toHaveLength(10);
    expect(walletSnapshot.totalPages).toBe(2);
    const second = (
      await request(app)
        .get(`${walletPathBuild()}?page=2`)
        .set("Cookie", otherDevice)
    ).body;
    expect(second.transactions).toHaveLength(4);
    expect(
      new Set(
        [...walletSnapshot.transactions, ...second.transactions].map(
          (x) => x.id,
        ),
      ).size,
    ).toBe(14);
    const saving = (
      await request(app)
        .get(`${walletPathBuild()}?filter=saving`)
        .set("Cookie", otherDevice)
    ).body;
    expect(saving.transactions[0].occurredTime).toBeNull();
    expect(saving.transactions[0].createdAt).toEqual(expect.any(String));
    expect(saving.totals).toEqual(walletSnapshot.totals);
    await request(app)
      .post("/api/auth/logout")
      .set(trusted)
      .set("Cookie", otherDevice)
      .expect(204);
    await request(app)
      .get(walletPathBuild())
      .set("Cookie", otherDevice)
      .expect(401);
  });

  it("serializes concurrent expense/saving and idempotent retries without overspending", async () => {
    const outcomes = await Promise.all(
      ["expense", "saving"].map((type) =>
        request(app)
          .post(`${walletPathBuild()}/transactions`)
          .set(trusted)
          .set("Cookie", cookies[0])
          .send(walletTransactionRequestBodyBuild(type, 6000)),
      ),
    );
    expect(outcomes.map((x) => x.status).sort()).toEqual([201, 409]);
    const repeated = walletTransactionRequestBodyBuild("income", 5);
    const results = await Promise.all(
      [1, 2].map(() =>
        request(app)
          .post(`${walletPathBuild()}/transactions`)
          .set(trusted)
          .set("Cookie", cookies[0])
          .send(repeated),
      ),
    );
    expect(results.map((x) => x.status)).toEqual([201, 201]);
    expect(results[0].body.id).toBe(results[1].body.id);
    expect(
      (await request(app).get(walletPathBuild()).set("Cookie", cookies[0])).body
        .totals.balance,
    ).toBe(3005);
  });
});
