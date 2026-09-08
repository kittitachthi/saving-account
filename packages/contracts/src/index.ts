export type AuthenticatedUser = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  personalWalletId: string;
};

export type AuthSessionResponse = {
  user: AuthenticatedUser;
  expiresAt: string;
};

export type BetaWaitlistRequest = {
  email: string;
  consent: true;
  consentVersion: string;
};

export type BetaWaitlistResponse = {
  message: string;
};
