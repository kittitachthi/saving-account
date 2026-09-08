CREATE TABLE "PrivacyAcceptance" (
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "version" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("userId", "version")
);
CREATE TABLE "WalletTransaction" (
  "id" UUID PRIMARY KEY,
  "walletId" UUID NOT NULL REFERENCES "Wallet"("id") ON DELETE CASCADE,
  "operationId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "type" TEXT NOT NULL CHECK ("type" IN ('income', 'expense', 'saving')),
  "amount" BIGINT NOT NULL CHECK ("amount" > 0 AND "amount" <= 9007199254740991),
  "occurredOn" VARCHAR(10) NOT NULL,
  "occurredTime" VARCHAR(5),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE ("walletId", "operationId")
);
CREATE INDEX "WalletTransaction_walletId_occurredOn_idx" ON "WalletTransaction"("walletId", "occurredOn");
CREATE TABLE "SavingsGoal" (
  "walletId" UUID PRIMARY KEY REFERENCES "Wallet"("id") ON DELETE CASCADE,
  "amount" BIGINT NOT NULL CHECK ("amount" > 0 AND "amount" <= 9007199254740991),
  "updatedAt" TIMESTAMP(3) NOT NULL
);
