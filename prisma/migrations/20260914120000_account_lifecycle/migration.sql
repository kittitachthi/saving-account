ALTER TYPE "NotificationKind" ADD VALUE 'WAITLIST_WITHDRAWAL';
ALTER TYPE "NotificationKind" ADD VALUE 'BETA_RESET_NOTICE';

ALTER TABLE "User" ADD COLUMN "pendingDeletionAt" TIMESTAMP(3);

CREATE TABLE "BetaWaitlistWithdrawal" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BetaWaitlistWithdrawal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BetaWaitlistWithdrawal_email_key" ON "BetaWaitlistWithdrawal"("email");
CREATE UNIQUE INDEX "BetaWaitlistWithdrawal_tokenHash_key" ON "BetaWaitlistWithdrawal"("tokenHash");
