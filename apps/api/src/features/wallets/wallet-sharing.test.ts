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
import { walletRoutesRegister } from "./wallet.routes.js";
import { WalletRepository } from "./wallet.repository.js";
import { privacyNotice } from "../privacy/privacy-notice.js";

loadEnvironment({ path: new URL("../../../../../.env", import.meta.url) });
const trusted = { Origin: "http://localhost:5173", "X-Pocka-Request": "1" };

describe("Wallet sharing through HTTP and PostgreSQL", () => {
  let db: Database;
  let app: ReturnType<typeof createApp>;
  const userIds: string[] = [];
  const cookies: string[] = [];
  let walletId: string;
  beforeAll(async () => {
    db = createDatabase(
      process.env.TEST_DATABASE_URL ??
        "postgresql://saving_account:saving_account_local@localhost:5432/saving_account?schema=public",
    );
    for (const email of ["owner", "viewer"].map(
      (name) => `${name}-${randomUUID()}@example.com`,
    )) {
      const token = randomUUID();
      const user = await db.client.user.create({
        data: {
          email,
          displayName: email.split("@")[0],
          sessions: {
            create: {
              tokenHash: createHash("sha256").update(token).digest("hex"),
              expiresAt: new Date("2030-01-01"),
            },
          },
          privacyAcceptances: { create: { version: privacyNotice.version } },
        },
      });
      await db.client.wallet.create({
        data: {
          ownerId: user.id,
          name: "Personal",
          memberships: { create: { userId: user.id, role: "OWNER" } },
        },
      });
      userIds.push(user.id);
      cookies.push(`saving_account_session=${token}`);
    }
    walletId = (
      await db.client.wallet.create({
        data: {
          ownerId: userIds[0],
          name: "Shared money",
          memberships: { create: { userId: userIds[0], role: "OWNER" } },
          transactions: {
            create: {
              operationId: randomUUID(),
              title: "Income",
              category: "Work",
              type: "income",
              amount: 10000,
              occurredOn: "2026-09-10",
            },
          },
        },
      })
    ).id;
    const auth = new AuthService(new PrismaAuthRepository(db.client), {
      createAuthorizationRequest: async () => {
        throw new Error("unused");
      },
      consumeAuthorizationResponse: async () => {
        throw new Error("unused");
      },
    });
    app = createApp({
      checkDatabase: () => db.checkConnection(),
      registerRoutes: (expressApp) =>
        walletRoutesRegister(
          expressApp,
          auth,
          new WalletRepository(db.client, privacyNotice.version),
          trusted.Origin,
        ),
    });
  });
  afterAll(async () => {
    await db.client.user.deleteMany({ where: { id: { in: userIds } } });
    await db.disconnect();
  });

  it("invites the named user once, exposes a live read-only Wallet, then revokes access", async () => {
    await request(app)
      .post(`/api/wallets/${walletId}/invitations`)
      .set(trusted)
      .set("Cookie", cookies[0])
      .send({
        email: (
          await db.client.user.findUniqueOrThrow({ where: { id: userIds[1] } })
        ).email.toUpperCase(),
      })
      .expect(201);
    const viewer = await db.client.user.findUniqueOrThrow({
      where: { id: userIds[1] },
    });
    const invitationJob = await db.client.notificationOutbox.findFirstOrThrow({
      where: { kind: "WALLET_INVITATION", recipientEmail: viewer.email },
      orderBy: { createdAt: "desc" },
    });
    const token = new URL(
      (invitationJob.payload as { invitationUrl: string }).invitationUrl,
    ).searchParams.get("invitation");
    expect(token).toBeTruthy();
    const preview = await request(app)
      .post("/api/wallets/invitations/preview")
      .set(trusted)
      .set("Cookie", cookies[1])
      .send({ token })
      .expect(200);
    expect(preview.body).toMatchObject({
      walletName: "Shared money",
      owner: { email: expect.any(String) },
    });
    const accepts = await Promise.all([
      request(app)
        .post("/api/wallets/invitations/accept")
        .set(trusted)
        .set("Cookie", cookies[1])
        .send({ token }),
      request(app)
        .post("/api/wallets/invitations/accept")
        .set(trusted)
        .set("Cookie", cookies[1])
        .send({ token }),
    ]);
    expect(accepts.map((response) => response.status).sort()).toEqual([
      200, 410,
    ]);
    expect(
      accepts.find((response) => response.status === 200)?.body.walletId,
    ).toBe(walletId);
    const snapshot = await request(app)
      .get(`/api/wallets/${walletId}`)
      .set("Cookie", cookies[1])
      .expect(200);
    expect(snapshot.body.wallet).toMatchObject({
      role: "viewer",
      owner: { email: expect.any(String) },
    });
    expect(snapshot.body.transactions[0]).toMatchObject({
      title: "Income",
      updatedAt: expect.any(String),
    });
    await request(app)
      .put(`/api/wallets/${walletId}/savings-goal`)
      .set(trusted)
      .set("Cookie", cookies[1])
      .send({ amount: 100 })
      .expect(403);
    await request(app)
      .get(`/api/wallets/${walletId}/export`)
      .set("Cookie", cookies[1])
      .expect(403);
    const sharing = await request(app)
      .get(`/api/wallets/${walletId}/sharing`)
      .set("Cookie", cookies[0])
      .expect(200);
    expect(sharing.body.viewers[0]).toMatchObject({
      userId: userIds[1],
      lastViewedAt: expect.any(String),
    });
    await request(app)
      .delete(`/api/wallets/${walletId}/viewers/${userIds[1]}`)
      .set(trusted)
      .set("Cookie", cookies[0])
      .expect(204);
    await request(app)
      .get(`/api/wallets/${walletId}`)
      .set("Cookie", cookies[1])
      .expect(403);
    const cancelled = await request(app)
      .post(`/api/wallets/${walletId}/invitations`)
      .set(trusted)
      .set("Cookie", cookies[0])
      .send({ email: viewer.email })
      .expect(201);
    const cancelledJob = await db.client.notificationOutbox.findUniqueOrThrow({
      where: { dedupeKey: `wallet-invitation:${cancelled.body.id}` },
    });
    const cancelledToken = new URL(
      (cancelledJob.payload as { invitationUrl: string }).invitationUrl,
    ).searchParams.get("invitation");
    const cancelRace = await Promise.all([
      request(app)
        .delete(`/api/wallets/${walletId}/invitations/${cancelled.body.id}`)
        .set(trusted)
        .set("Cookie", cookies[0]),
      request(app)
        .post("/api/wallets/invitations/accept")
        .set(trusted)
        .set("Cookie", cookies[1])
        .send({ token: cancelledToken }),
    ]);
    expect(
      cancelRace.filter((response) => response.status === 410),
    ).toHaveLength(1);
    if (cancelRace[1].status === 200)
      await request(app)
        .delete(`/api/wallets/${walletId}/viewers/${userIds[1]}`)
        .set(trusted)
        .set("Cookie", cookies[0])
        .expect(204);
    const leaving = await request(app)
      .post(`/api/wallets/${walletId}/invitations`)
      .set(trusted)
      .set("Cookie", cookies[0])
      .send({ email: viewer.email })
      .expect(201);
    const leaveJob = await db.client.notificationOutbox.findUniqueOrThrow({
      where: { dedupeKey: `wallet-invitation:${leaving.body.id}` },
    });
    const leaveToken = new URL(
      (leaveJob.payload as { invitationUrl: string }).invitationUrl,
    ).searchParams.get("invitation");
    await request(app)
      .post("/api/wallets/invitations/accept")
      .set(trusted)
      .set("Cookie", cookies[1])
      .send({ token: leaveToken })
      .expect(200);
    await request(app)
      .post(`/api/wallets/${walletId}/leave`)
      .set(trusted)
      .set("Cookie", cookies[1])
      .expect(204);
    await request(app)
      .get(`/api/wallets/${walletId}`)
      .set("Cookie", cookies[1])
      .expect(403);
    const owner = await db.client.user.findUniqueOrThrow({
      where: { id: userIds[0] },
    });
    expect(
      await db.client.notificationOutbox.count({
        where: { kind: "WALLET_ACCESS_CHANGED", recipientEmail: owner.email },
      }),
    ).toBeGreaterThanOrEqual(4);
  });
});
