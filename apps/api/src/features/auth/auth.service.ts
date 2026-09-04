import { createHash, randomBytes } from "node:crypto";
import type {
  AuthRepository,
  AuthenticatedUser,
  GoogleIdentityProvider,
} from "./auth.types.js";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

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

  async complete(callbackUrl: URL, state: string) {
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
    const user = await this.repository.createSessionForAllowedIdentity(
      { ...identity, email: identity.email.trim().toLowerCase() },
      hashSecret(sessionToken),
      new Date(this.now().getTime() + SESSION_DURATION_MS),
    );
    if (!user) throw new AuthenticationRejectedError();

    return { sessionToken, user, returnTo: attempt.returnTo };
  }

  async authenticate(sessionToken: string): Promise<AuthenticatedUser | null> {
    return this.repository.findUserBySession(
      hashSecret(sessionToken),
      this.now(),
    );
  }

  async logout(sessionToken: string) {
    await this.repository.revokeSession(hashSecret(sessionToken));
  }
}
