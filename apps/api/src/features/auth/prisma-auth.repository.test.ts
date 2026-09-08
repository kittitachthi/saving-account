import { createHash, randomUUID } from "node:crypto";
import request from "supertest";
import { config as loadEnvironment } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createDatabase,
  type Database,
} from "../../infrastructure/db/database.js";
import { PrismaAuthRepository } from "./prisma-auth.repository.js";
import { createApp } from "../../app.js";
import { registerAuthRoutes } from "./auth.routes.js";
import { AuthService } from "./auth.service.js";
import type { GoogleIdentityProvider } from "./auth.types.js";

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
      avatarUrl: "https://lh3.googleusercontent.com/first",
    };

    const first = await repository.createSessionForAllowedIdentity(
      identity,
      `first-${suffix}`,
      new Date(Date.now() + 60_000),
    );
    const second = await repository.createSessionForAllowedIdentity(
      { ...identity, avatarUrl: "https://lh3.googleusercontent.com/second" },
      `second-${suffix}`,
      new Date(Date.now() + 60_000),
    );
    const third = await repository.createSessionForAllowedIdentity(
      { ...identity, avatarUrl: null },
      `third-${suffix}`,
      new Date(Date.now() + 60_000),
    );

    expect(first?.avatarUrl).toBe("https://lh3.googleusercontent.com/first");
    expect(second?.avatarUrl).toBe("https://lh3.googleusercontent.com/second");
    expect(third?.avatarUrl).toBeNull();
    expect(first?.personalWalletId).toEqual(expect.any(String));
    expect(
      await database.client.user.count({ where: { email: allowedEmail } }),
    ).toBe(1);
    expect(
      await database.client.walletMembership.count({
        where: { userId: first!.id, role: "OWNER" },
      }),
    ).toBe(1);

    await repository.revokeSession(`first-${suffix}`, new Date());
    expect(
      await repository.findSession(`first-${suffix}`, new Date()),
    ).toBeNull();
    expect(
      await repository.findSession(`second-${suffix}`, new Date()),
    ).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({ id: first!.id, avatarUrl: null }),
      }),
    );
  });

  it("does not persist an ineligible Google identity", async () => {
    const repository = new PrismaAuthRepository(database.client);
    const result = await repository.createSessionForAllowedIdentity(
      {
        subject: `rejected-${suffix}`,
        email: rejectedEmail,
        emailVerified: true,
        displayName: "Rejected Visitor",
        avatarUrl: null,
      },
      `rejected-token-${suffix}`,
      new Date(Date.now() + 60_000),
    );

    expect(result).toBeNull();
    expect(
      await database.client.user.count({ where: { email: rejectedEmail } }),
    ).toBe(0);
  });

  it("persists the HTTP login, CSRF, renewal and logout lifecycle with matching cookies", async () => {
    let now = new Date();
    const state = `http-state-${suffix}`;
    const google: GoogleIdentityProvider = {
      createAuthorizationRequest: async () => ({
        authorizationUrl: `https://accounts.google.com/authorize?state=${state}`,
        state,
        nonce: "test-nonce",
        codeVerifier: "test-verifier",
      }),
      consumeAuthorizationResponse: async () => ({
        subject: `subject-${suffix}`,
        email: allowedEmail,
        emailVerified: true,
        displayName: "Allowed Friend",
        avatarUrl: null,
      }),
    };
    const auth = new AuthService(
      new PrismaAuthRepository(database.client),
      google,
      () => now,
    );
    const app = createApp({
      checkDatabase: () => database.checkConnection(),
      registerRoutes: (application) =>
        registerAuthRoutes(application, auth, {
          appOrigin: "http://localhost:5173",
          googleRedirectUri: "http://localhost:5173/api/auth/google/callback",
          secureCookies: false,
        }),
    });
    const trusted = { Origin: "http://localhost:5173", "X-Pocka-Request": "1" };
    await request(app).get("/api/auth/google/start").expect(302);
    const callback = await request(app)
      .get(`/api/auth/google/callback?state=${state}&code=test-code`)
      .expect(302);
    const cookie = callback.headers["set-cookie"][0].split(";")[0];
    const token = decodeURIComponent(cookie.slice(cookie.indexOf("=") + 1));
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const original = await database.client.session.findUniqueOrThrow({
      where: { tokenHash },
    });
    expect(callback.headers["set-cookie"][0]).toContain(
      `Expires=${original.expiresAt.toUTCString()}`,
    );

    now = new Date(now.getTime() + 86400000);
    for (const path of ["/api/auth/session/renew", "/api/auth/logout"]) {
      await request(app).post(path).set("Cookie", cookie).expect(403);
    }
    expect(
      (
        await database.client.session.findUniqueOrThrow({
          where: { tokenHash },
        })
      ).expiresAt,
    ).toEqual(original.expiresAt);

    const renewed = await request(app)
      .post("/api/auth/session/renew")
      .set(trusted)
      .set("Cookie", cookie)
      .expect(200);
    const saved = await database.client.session.findUniqueOrThrow({
      where: { tokenHash },
    });
    expect(saved.expiresAt.getTime()).toBe(now.getTime() + 7 * 86400000);
    expect(saved.lastSeenAt).toEqual(now);
    expect(renewed.body.expiresAt).toBe(saved.expiresAt.toISOString());
    expect(renewed.headers["set-cookie"][0]).toContain(
      `Expires=${saved.expiresAt.toUTCString()}`,
    );
    const logout = await request(app)
      .post("/api/auth/logout")
      .set(trusted)
      .set("Cookie", cookie)
      .expect(204);
    expect(logout.headers["set-cookie"][0]).toContain(
      "Expires=Thu, 01 Jan 1970",
    );
    expect(
      await database.client.session.findUnique({ where: { tokenHash } }),
    ).toBeNull();
    await request(app)
      .post("/api/auth/session/renew")
      .set(trusted)
      .set("Cookie", cookie)
      .expect(401);
    await request(app)
      .get("/api/auth/session")
      .set("Cookie", cookie)
      .expect(401);
  });

  it("renews atomically without shortening expiry or reviving revoked/expired Sessions", async () => {
    const repository = new PrismaAuthRepository(database.client);
    const identity = {
      subject: `rolling-${suffix}`,
      email: `rolling-${suffix}@example.com`,
      emailVerified: true,
      displayName: "Rolling tester",
      avatarUrl: null,
    };
    await database.client.betaAllowlist.create({
      data: { email: identity.email, addedBy: "integration-test" },
    });
    try {
      const now = new Date();
      const initialExpiry = new Date(now.getTime() + 60000);
      const token = `rolling-token-${suffix}`;
      const user = await repository.createSessionForAllowedIdentity(
        identity,
        token,
        initialExpiry,
      );
      const earlier = new Date(now.getTime() + 7 * 86400000);
      const later = new Date(earlier.getTime() + 1000);
      const results = await Promise.all([
        repository.renewSession(token, now, later),
        repository.renewSession(token, now, earlier),
      ]);
      expect(results.every((result) => result?.user.id === user?.id)).toBe(
        true,
      );
      expect((await repository.findSession(token, now))?.expiresAt).toEqual(
        later,
      );
      expect(
        await repository.renewSession(
          token,
          later,
          new Date(later.getTime() + 86400000),
        ),
      ).toBeNull();
      expect(await repository.revokeSession(token, later)).toBe(false);

      await Promise.all([
        repository.renewSession(token, now, new Date(later.getTime() + 1000)),
        repository.revokeSession(token, now),
      ]);
      expect(await repository.findSession(token, now)).toBeNull();
      expect(await repository.renewSession(token, now, later)).toBeNull();
      expect(await repository.revokeSession(token, now)).toBe(false);
      expect(
        await database.client.session.count({ where: { tokenHash: token } }),
      ).toBe(0);
    } finally {
      await database.client.user.deleteMany({
        where: { email: identity.email },
      });
      await database.client.betaAllowlist.deleteMany({
        where: { email: identity.email },
      });
    }
  });
});
