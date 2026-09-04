export type GoogleIdentity = {
  subject: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
};

export type OAuthAttempt = {
  state: string;
  nonce: string;
  codeVerifier: string;
  returnTo: string;
};

export interface GoogleIdentityProvider {
  createAuthorizationRequest(): Promise<{
    authorizationUrl: string;
    state: string;
    nonce: string;
    codeVerifier: string;
  }>;
  consumeAuthorizationResponse(
    callbackUrl: URL,
    attempt: OAuthAttempt,
  ): Promise<GoogleIdentity>;
}

export interface AuthRepository {
  saveOAuthAttempt(attempt: OAuthAttempt): Promise<void>;
  consumeOAuthAttempt(state: string): Promise<OAuthAttempt | null>;
  createSessionForAllowedIdentity(
    identity: GoogleIdentity,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<AuthenticatedUser | null>;
  findUserBySession(
    tokenHash: string,
    now: Date,
  ): Promise<AuthenticatedUser | null>;
  revokeSession(tokenHash: string): Promise<void>;
}
import type { AuthenticatedUser } from "@saving-account/contracts";

export type { AuthenticatedUser } from "@saving-account/contracts";
