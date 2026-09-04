import { beforeEach, describe, expect, it, vi } from "vitest";

const oidc = vi.hoisted(() => ({
  authorizationCodeGrant: vi.fn(),
  discovery: vi.fn().mockResolvedValue({}),
}));

vi.mock("openid-client", () => ({
  ...oidc,
  buildAuthorizationUrl: vi.fn(),
  calculatePKCECodeChallenge: vi.fn(),
  randomNonce: vi.fn(),
  randomPKCECodeVerifier: vi.fn(),
  randomState: vi.fn(),
}));

import { createGoogleIdentityProvider } from "./google-identity-provider.js";

const attempt = {
  state: "state-1",
  nonce: "nonce-1",
  codeVerifier: "verifier-1",
  returnTo: "/",
};

describe("Google identity provider", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    [
      "https://lh3.googleusercontent.com/friend",
      "https://lh3.googleusercontent.com/friend",
    ],
    [undefined, null],
  ])("maps the picture claim %s to avatarUrl", async (picture, expected) => {
    oidc.authorizationCodeGrant.mockResolvedValue({
      claims: () => ({
        sub: "google-subject-1",
        email: "friend@example.com",
        email_verified: true,
        name: "Friend",
        picture,
      }),
    });
    const provider = createGoogleIdentityProvider({
      clientId: "client-id",
      clientSecret: "client-secret",
      redirectUri: "http://localhost:5173/api/auth/google/callback",
    });

    await expect(
      provider.consumeAuthorizationResponse(
        new URL("http://localhost:5173/api/auth/google/callback?code=code-1"),
        attempt,
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        subject: "google-subject-1",
        email: "friend@example.com",
        displayName: "Friend",
        avatarUrl: expected,
      }),
    );
  });
});
