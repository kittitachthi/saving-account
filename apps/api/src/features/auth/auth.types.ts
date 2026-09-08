export type GoogleIdentity = {
  subject: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  avatarUrl: string | null;
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
  findSession(
    tokenHash: string,
    now: Date,
  ): Promise<AuthenticatedSession | null>;
  renewSession(
    tokenHash: string,
    now: Date,
    expiresAt: Date,
  ): Promise<AuthenticatedSession | null>;
  revokeSession(tokenHash: string, now: Date): Promise<boolean>;
}
export type AuthenticatedSession = { user: AuthenticatedUser; expiresAt: Date };
import type { AuthenticatedUser } from "@saving-account/contracts";

export type { AuthenticatedUser } from "@saving-account/contracts";
