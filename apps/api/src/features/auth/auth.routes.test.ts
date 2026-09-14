import request from "supertest";
import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../app.js";
import { registerAuthRoutes } from "./auth.routes.js";
import { AuthService } from "./auth.service.js";
import type {
  AuthRepository,
  GoogleIdentityProvider,
  OAuthAttempt,
} from "./auth.types.js";

const user = {
  id: "user-1",
  email: "friend@example.com",
  displayName: "Friend",
  avatarUrl: "https://lh3.googleusercontent.com/friend",
  personalWalletId: "wallet-1",
};

function createAuthApp({
  allowed = true,
  verified = true,
  secureCookies = false,
  appOrigin = "http://localhost:5173",
  googleRedirectUri = "http://localhost:5173/api/auth/google/callback",
  now = () => new Date(),
  accountRecovered = false,
} = {}) {
  let attempt: OAuthAttempt | null = null;
  const sessions = new Map<string, { user: typeof user; expiresAt: Date }>();
  const repository: AuthRepository = {
    saveOAuthAttempt: vi.fn(async (saved) => {
      attempt = saved;
    }),
    consumeOAuthAttempt: vi.fn(async (state) => {
      if (!attempt || attempt.state !== state) return null;
      const consumed = attempt;
      attempt = null;
      return consumed;
    }),
    createSessionForAllowedIdentity: vi.fn(
      async (_identity, tokenHash, expiresAt) => {
        if (!allowed) return null;
        sessions.set(tokenHash, { user, expiresAt });
        return accountRecovered
          ? { ...user, accountRecovered: true as const }
          : user;
      },
    ),
    findSession: vi.fn(async (tokenHash, current) => {
      const session = sessions.get(tokenHash);
      return session && session.expiresAt > current ? session : null;
    }),
    renewSession: vi.fn(async (tokenHash, current, expiresAt) => {
      const session = sessions.get(tokenHash);
      if (!session || session.expiresAt <= current) return null;
      session.expiresAt = new Date(
        Math.max(session.expiresAt.getTime(), expiresAt.getTime()),
      );
      return session;
    }),
    revokeSession: vi.fn(async (tokenHash, current) => {
      const session = sessions.get(tokenHash);
      if (!session || session.expiresAt <= current) return false;
      return sessions.delete(tokenHash);
    }),
    authSessionsList: vi.fn(async (tokenHash, current) => {
      const session = sessions.get(tokenHash);
      if (!session || session.expiresAt <= current) return [];
      return [
        {
          id: tokenHash,
          deviceLabel: "Chrome บน Windows",
          current: true,
          createdAt: current.toISOString(),
          lastSeenAt: current.toISOString(),
          expiresAt: session.expiresAt.toISOString(),
        },
      ];
    }),
    authSessionRevoke: vi.fn(async (tokenHash, sessionId, current) => {
      const session = sessions.get(tokenHash);
      if (!session || session.expiresAt <= current || sessionId !== tokenHash)
        return false;
      return sessions.delete(tokenHash);
    }),
    authSessionsRevokeAll: vi.fn(async (tokenHash, current) => {
      const session = sessions.get(tokenHash);
      if (!session || session.expiresAt <= current) return false;
      sessions.clear();
      return true;
    }),
    accountDeletionRequest: vi.fn(async (tokenHash, current) => {
      const session = sessions.get(tokenHash);
      if (!session || session.expiresAt <= current) return false;
      sessions.clear();
      return true;
    }),
  };
  const google: GoogleIdentityProvider = {
    createAuthorizationRequest: vi.fn(async () => ({
      authorizationUrl: "https://accounts.google.com/authorize?state=state-1",
      state: "state-1",
      nonce: "nonce-1",
      codeVerifier: "verifier-1",
    })),
    consumeAuthorizationResponse: vi.fn(async () => ({
      subject: "google-subject-1",
      email: " Friend@Example.com ",
      emailVerified: verified,
      displayName: "Friend",
      avatarUrl: "https://lh3.googleusercontent.com/friend",
    })),
  };
  const auth = new AuthService(repository, google, now);
  return {
    app: createApp({
      checkDatabase: vi.fn(),
      registerRoutes: (app) =>
        registerAuthRoutes(app, auth, {
          appOrigin,
          googleRedirectUri,
          secureCookies,
        }),
    }),
    repository,
    google,
    sessions,
  };
}

describe("Google authentication", () => {
  const trusted = { Origin: "http://localhost:5173", "X-Pocka-Request": "1" };
  async function signIn(app: ReturnType<typeof createAuthApp>["app"]) {
    const browser = request.agent(app);
    await browser.get("/api/auth/google/start");
    await browser.get("/api/auth/google/callback?state=state-1&code=code-1");
    return browser;
  }

  it.each([undefined, "unknown", "%E0%A4%A"])(
    "rejects missing/invalid logout cookie %s without reporting success",
    async (cookie) => {
      const { app } = createAuthApp();
      const call = request(app).post("/api/auth/logout").set(trusted);
      if (cookie) call.set("Cookie", `saving_account_session=${cookie}`);
      const response = await call;
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("UNAUTHENTICATED");
      expect(response.headers["set-cookie"]).toBeUndefined();
    },
  );

  it("rejects expired logout and revokes only the current valid device", async () => {
    let time = new Date("2030-09-07T00:00:00Z");
    const { app } = createAuthApp({ now: () => time });
    const expired = await signIn(app);
    time = new Date("2030-09-14T00:00:00Z");
    expect((await expired.post("/api/auth/logout").set(trusted)).status).toBe(
      401,
    );
    const first = await signIn(app);
    const second = await signIn(app);
    const logout = await first.post("/api/auth/logout").set(trusted);
    expect(logout.status).toBe(204);
    expect(logout.headers["set-cookie"][0]).toContain(
      "Expires=Thu, 01 Jan 1970",
    );
    expect((await first.post("/api/auth/logout").set(trusted)).status).toBe(
      401,
    );
    expect((await second.get("/api/auth/session")).status).toBe(200);
  });

  it.each(["/api/auth/logout", "/api/auth/session/renew"])(
    "enforces CSRF on %s without mutating the Session",
    async (path) => {
      const { app, repository } = createAuthApp();
      const browser = await signIn(app);
      for (const headers of [
        {},
        { Origin: trusted.Origin },
        { "X-Pocka-Request": "1" },
        { ...trusted, Origin: "null" },
        { ...trusted, Origin: "https://attacker.example" },
        { ...trusted, Origin: "http://localhost:5173.attacker.example" },
        { ...trusted, "Sec-Fetch-Site": "cross-site" },
        { ...trusted, "X-Pocka-Request": "wrong" },
      ]) {
        const response = await browser.post(path).set(headers);
        expect(response.status).toBe(403);
        expect(response.body.error.code).toBe("CSRF_REJECTED");
        expect(response.headers["set-cookie"]).toBeUndefined();
      }
      expect(repository.revokeSession).not.toHaveBeenCalled();
      expect(repository.renewSession).not.toHaveBeenCalled();
      expect((await browser.get("/api/auth/session")).status).toBe(200);
    },
  );

  it("renews a valid Session for seven days, preserves cookie flags and never revives an expired or revoked Session", async () => {
    let time = new Date("2030-09-07T00:00:00Z");
    const { app, sessions } = createAuthApp({ now: () => time });
    const browser = await signIn(app);
    const read = await browser.get("/api/auth/session");
    expect(read.status, JSON.stringify(read.body)).toBe(200);
    expect(read.headers["set-cookie"]).toBeUndefined();
    expect(read.headers["cache-control"]).toContain("no-store");
    expect(read.body.expiresAt).toBe("2030-09-14T00:00:00.000Z");
    time = new Date("2030-09-13T00:00:00Z");
    const renewed = await browser.post("/api/auth/session/renew").set(trusted);
    expect(renewed.status).toBe(200);
    expect(renewed.body.expiresAt).toBe("2030-09-20T00:00:00.000Z");
    expect(renewed.headers["cache-control"]).toContain("no-store");
    const cookie = renewed.headers["set-cookie"][0];
    expect(cookie).toContain(
      `Expires=${new Date(renewed.body.expiresAt).toUTCString()}`,
    );
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    const token = decodeURIComponent(cookie.split(";")[0].split("=")[1]);
    expect(
      sessions
        .get(createHash("sha256").update(token).digest("hex"))
        ?.expiresAt.toISOString(),
    ).toBe(renewed.body.expiresAt);
    time = new Date("2030-09-20T00:00:00Z");
    expect(
      (await browser.post("/api/auth/session/renew").set(trusted)).status,
    ).toBe(401);
    const next = await signIn(app);
    const nextCookie = (
      await next.post("/api/auth/session/renew").set(trusted)
    ).headers["set-cookie"][0].split(";")[0];
    await next.post("/api/auth/logout").set(trusted);
    const denied = await request(app)
      .post("/api/auth/session/renew")
      .set(trusted)
      .set("Cookie", nextCookie);
    expect(denied.status).toBe(401);
    expect(denied.headers["set-cookie"]).toBeUndefined();
  });

  it("preserves Secure on renewal and does not trust Host for CSRF", async () => {
    const { app } = createAuthApp({
      secureCookies: true,
      appOrigin: "https://pocka.example",
    });
    await request(app).get("/api/auth/google/start");
    const callback = await request(app).get(
      "/api/auth/google/callback?state=state-1&code=code-1",
    );
    const cookie = callback.headers["set-cookie"][0].split(";")[0];
    const response = await request(app)
      .post("/api/auth/session/renew")
      .set("Cookie", cookie)
      .set({ ...trusted, Origin: "https://pocka.example" });
    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"][0]).toContain("Secure");
    const forged = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookie)
      .set({
        ...trusted,
        Origin: "https://attacker.example",
        Host: "attacker.example",
        "X-Forwarded-Host": "attacker.example",
      });
    expect(forged.status).toBe(403);
  });
  it("starts Google OIDC and only preserves an internal return path", async () => {
    const { app, repository } = createAuthApp();
    const response = await request(app).get(
      "/api/auth/google/start?returnTo=https://attacker.example",
    );

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("accounts.google.com");
    expect(repository.saveOAuthAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ returnTo: "/", state: "state-1" }),
    );

    await request(app).get(
      "/api/auth/google/start?returnTo=%2F%5C%5Cattacker.example",
    );
    expect(repository.saveOAuthAttempt).toHaveBeenLastCalledWith(
      expect.objectContaining({ returnTo: "/" }),
    );

    await request(app).get(
      "/api/auth/google/start?returnTo=%2Fwallet%0ASet-Cookie%3Aunsafe",
    );
    expect(repository.saveOAuthAttempt).toHaveBeenLastCalledWith(
      expect.objectContaining({ returnTo: "/" }),
    );
  });

  it("creates a Session for an allowed verified Google identity", async () => {
    const { app, repository, google } = createAuthApp();
    const browser = request.agent(app);
    await browser.get("/api/auth/google/start?returnTo=/wallet");
    const callback = await browser.get(
      "/api/auth/google/callback?state=state-1&code=code-1",
    );

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toBe("http://localhost:5173/wallet");
    const sessionCookie = callback.headers["set-cookie"]?.[0];
    expect(sessionCookie).toContain("saving_account_session=");
    expect(sessionCookie).toContain("Expires=");
    expect(sessionCookie).toContain("Path=/");
    expect(sessionCookie).toContain("HttpOnly");
    expect(sessionCookie).toContain("SameSite=Lax");
    expect(google.consumeAuthorizationResponse).toHaveBeenCalledWith(
      new URL(
        "http://localhost:5173/api/auth/google/callback?state=state-1&code=code-1",
      ),
      expect.objectContaining({ nonce: "nonce-1", codeVerifier: "verifier-1" }),
    );
    expect(repository.createSessionForAllowedIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ email: "friend@example.com" }),
      expect.stringMatching(/^[a-f0-9]{64}$/),
      expect.any(Date),
      expect.any(String),
    );
    const session = await browser.get("/api/auth/session");
    expect(session.status).toBe(200);
    expect(session.body).toEqual({ user, expiresAt: expect.any(String) });
  });

  it("marks the return URL after recovering an Account", async () => {
    const { app } = createAuthApp({ accountRecovered: true });
    const browser = request.agent(app);
    await browser.get("/api/auth/google/start?returnTo=/wallet?tab=settings");
    const callback = await browser.get(
      "/api/auth/google/callback?state=state-1&code=code-1",
    );
    expect(callback.headers.location).toBe(
      "http://localhost:5173/wallet?tab=settings&accountRecovered=1",
    );
  });

  it("ignores request host headers when creating callback and return URLs", async () => {
    const { app, google } = createAuthApp();
    await request(app).get(
      "/api/auth/google/start?returnTo=/wallet?tab=recent",
    );
    const response = await request(app)
      .get("/api/auth/google/callback?state=state-1&code=code-1")
      .set("host", "attacker.example");

    expect(google.consumeAuthorizationResponse).toHaveBeenCalledWith(
      new URL(
        "http://localhost:5173/api/auth/google/callback?state=state-1&code=code-1",
      ),
      expect.anything(),
    );
    expect(response.headers.location).toBe(
      "http://localhost:5173/wallet?tab=recent",
    );
  });

  it.each([
    { allowed: false, verified: true },
    { allowed: true, verified: false },
  ])(
    "rejects ineligible identities without disclosing why",
    async (options) => {
      const { app } = createAuthApp(options);
      await request(app).get("/api/auth/google/start");
      const response = await request(app).get(
        "/api/auth/google/callback?state=state-1&code=code-1",
      );

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: {
          code: "AUTHENTICATION_REJECTED",
          message: "This account cannot sign in",
        },
      });
    },
  );

  it("requires a valid Session and revokes it on backend logout", async () => {
    const { app } = createAuthApp();
    const browser = request.agent(app);
    expect((await browser.get("/api/auth/session")).status).toBe(401);
    await browser.get("/api/auth/google/start");
    await browser.get("/api/auth/google/callback?state=state-1&code=code-1");

    expect(
      (
        await browser
          .post("/api/auth/logout")
          .set("Origin", "http://localhost:5173")
          .set("X-Pocka-Request", "1")
      ).status,
    ).toBe(204);
    expect((await browser.get("/api/auth/session")).status).toBe(401);
  });

  it("lists the current device and protects Session revocation with CSRF", async () => {
    const { app } = createAuthApp();
    const browser = await signIn(app);
    const listed = await browser.get("/api/auth/sessions");
    expect(listed.status).toBe(200);
    expect(listed.body).toEqual([
      expect.objectContaining({ id: expect.any(String), current: true }),
    ]);
    expect(
      (await browser.delete(`/api/auth/sessions/${listed.body[0].id}`)).status,
    ).toBe(403);
    expect(
      (
        await browser
          .delete(`/api/auth/sessions/${listed.body[0].id}`)
          .set(trusted)
      ).status,
    ).toBe(204);
    expect((await browser.get("/api/auth/session")).status).toBe(401);
  });

  it("revokes every Session and clears the current cookie", async () => {
    const { app } = createAuthApp();
    const browser = await signIn(app);
    const response = await browser.delete("/api/auth/sessions").set(trusted);
    expect(response.status).toBe(204);
    expect(response.headers["set-cookie"][0]).toContain(
      "Expires=Thu, 01 Jan 1970",
    );
    expect((await browser.get("/api/auth/session")).status).toBe(401);
  });

  it("starts account deletion without requiring Privacy acceptance and revokes the Session", async () => {
    const { app } = createAuthApp();
    const browser = await signIn(app);
    const response = await browser
      .post("/api/auth/account/deletion")
      .set(trusted);
    expect(response.status).toBe(204);
    expect(response.headers["set-cookie"][0]).toContain(
      "Expires=Thu, 01 Jan 1970",
    );
    expect((await browser.get("/api/auth/session")).status).toBe(401);
  });

  it("marks the Session cookie Secure in beta/production topology", async () => {
    const { app } = createAuthApp({ secureCookies: true });
    await request(app).get("/api/auth/google/start");
    const response = await request(app).get(
      "/api/auth/google/callback?state=state-1&code=code-1",
    );

    expect(response.headers["set-cookie"]?.[0]).toContain("Secure");
  });
});
