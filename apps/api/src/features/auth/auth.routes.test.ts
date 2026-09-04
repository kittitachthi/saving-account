import request from "supertest";
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
  personalWalletId: "wallet-1",
};

function createAuthApp({
  allowed = true,
  verified = true,
  secureCookies = false,
  appOrigin = "http://localhost:5173",
  googleRedirectUri = "http://localhost:5173/api/auth/google/callback",
} = {}) {
  let attempt: OAuthAttempt | null = null;
  let activeSession = false;
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
    createSessionForAllowedIdentity: vi.fn(async () => {
      if (!allowed) return null;
      activeSession = true;
      return user;
    }),
    findUserBySession: vi.fn(async () => (activeSession ? user : null)),
    revokeSession: vi.fn(async () => {
      activeSession = false;
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
    })),
  };
  const auth = new AuthService(repository, google);
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
  };
}

describe("Google authentication", () => {
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
    expect(sessionCookie).toContain("Max-Age=604800");
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
    );
    const session = await browser.get("/api/auth/session");
    expect(session.status).toBe(200);
    expect(session.body).toEqual({ user });
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

    expect((await browser.post("/api/auth/logout")).status).toBe(204);
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
