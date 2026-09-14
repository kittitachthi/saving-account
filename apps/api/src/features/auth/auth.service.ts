import { createHash, randomBytes } from "node:crypto";
import type { AuthRepository, GoogleIdentityProvider } from "./auth.types.js";

export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

function isSafeInternalPath(path: string) {
  const hasControlCharacter = [...path].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127;
  });
  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\") &&
    !hasControlCharacter
  );
}

export class AuthenticationRejectedError extends Error {}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly google: GoogleIdentityProvider,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async begin(returnTo: string) {
    const safeReturnTo = isSafeInternalPath(returnTo) ? returnTo : "/";
    const request = await this.google.createAuthorizationRequest();
    await this.repository.saveOAuthAttempt({
      state: request.state,
      nonce: request.nonce,
      codeVerifier: request.codeVerifier,
      returnTo: safeReturnTo,
    });
    return { authorizationUrl: request.authorizationUrl };
  }

  async complete(callbackUrl: URL, state: string, deviceLabel: string) {
    const attempt = await this.repository.consumeOAuthAttempt(state);
    if (!attempt) throw new AuthenticationRejectedError();

    let identity;
    try {
      identity = await this.google.consumeAuthorizationResponse(
        callbackUrl,
        attempt,
      );
    } catch {
      throw new AuthenticationRejectedError();
    }
    if (!identity.emailVerified) throw new AuthenticationRejectedError();

    const sessionToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(this.now().getTime() + SESSION_DURATION_MS);
    const user = await this.repository.createSessionForAllowedIdentity(
      { ...identity, email: identity.email.trim().toLowerCase() },
      hashSecret(sessionToken),
      expiresAt,
      deviceLabel,
    );
    if (!user) throw new AuthenticationRejectedError();

    return { sessionToken, user, expiresAt, returnTo: attempt.returnTo };
  }

  async authenticate(sessionToken: string) {
    return this.repository.findSession(hashSecret(sessionToken), this.now());
  }

  async logout(sessionToken: string) {
    return this.repository.revokeSession(hashSecret(sessionToken), this.now());
  }

  async renew(sessionToken: string) {
    const now = this.now();
    return this.repository.renewSession(
      hashSecret(sessionToken),
      now,
      new Date(now.getTime() + SESSION_DURATION_MS),
    );
  }

  async authSessionsList(sessionToken: string) {
    return this.repository.authSessionsList(
      hashSecret(sessionToken),
      this.now(),
    );
  }

  async authSessionRevoke(sessionToken: string, sessionId: string) {
    return this.repository.authSessionRevoke(
      hashSecret(sessionToken),
      sessionId,
      this.now(),
    );
  }

  async authSessionsRevokeAll(sessionToken: string) {
    return this.repository.authSessionsRevokeAll(
      hashSecret(sessionToken),
      this.now(),
    );
  }

  async accountDeletionRequest(sessionToken: string) {
    return this.repository.accountDeletionRequest(
      hashSecret(sessionToken),
      this.now(),
    );
  }
}
