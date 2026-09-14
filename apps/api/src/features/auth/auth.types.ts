import type {
  AuthenticatedUser,
  AuthDeviceSession,
} from "@saving-account/contracts";

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
    deviceLabel?: string,
  ): Promise<(AuthenticatedUser & { accountRecovered?: true }) | null>;
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
  authSessionsList(tokenHash: string, now: Date): Promise<AuthDeviceSession[]>;
  authSessionRevoke(
    tokenHash: string,
    sessionId: string,
    now: Date,
  ): Promise<boolean>;
  authSessionsRevokeAll(tokenHash: string, now: Date): Promise<boolean>;
  accountDeletionRequest(tokenHash: string, now: Date): Promise<boolean>;
}
export type AuthenticatedSession = { user: AuthenticatedUser; expiresAt: Date };
export type { AuthenticatedUser } from "@saving-account/contracts";
