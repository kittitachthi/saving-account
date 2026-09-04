export type AuthenticatedUser = {
  id: string;
  displayName: string;
  email: string;
  personalWalletId: string;
};

export type AuthSessionResponse = {
  user: AuthenticatedUser;
};
