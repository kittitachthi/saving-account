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

export type PrivacyNoticeResponse = {
  version: string;
  paragraphs: string[];
  accepted: boolean;
};
export type WalletTransactionType = "income" | "expense" | "saving";
export type CreateWalletTransaction = {
  operationId: string;
  title: string;
  category: string;
  type: WalletTransactionType;
  amount: number; // Integer satang; all monetary HTTP fields use this unit.
  occurredOn: string;
  occurredTime: string | null;
};
export type WalletTransaction = Omit<CreateWalletTransaction, "operationId"> & {
  id: string;
  createdAt: string;
  updatedAt: string;
};
export type WalletCategory = {
  name: string;
  total: number;
  count: number;
  average: number;
};
export type WalletSnapshot = {
  wallet: { id: string; name: string; timezone: string };
  today: string;
  nextDayAt: string;
  transactions: WalletTransaction[];
  page: number;
  totalPages: number;
  totals: { income: number; expense: number; saving: number; balance: number };
  monthly: { income: number; expense: number };
  daily: Array<{
    type: "income" | "expense";
    total: number;
    count: number;
    highest: WalletTransaction[];
  }>;
  expenseCategories: WalletCategory[];
  savingsCategories: WalletCategory[];
  goal: number | null;
};
export type EditWalletTransaction = Omit<
  CreateWalletTransaction,
  "operationId" | "type"
> & {
  expectedUpdatedAt: string;
};

export type DeleteWalletTransaction = {
  operationId: string;
  expectedUpdatedAt: string;
};

export type WalletUndoReceipt = {
  operationId: string;
  undoUntil: string;
  serverTime: string;
};
