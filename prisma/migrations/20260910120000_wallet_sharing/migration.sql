ALTER TYPE "NotificationKind" ADD VALUE 'WALLET_INVITATION';
ALTER TYPE "NotificationKind" ADD VALUE 'WALLET_ACCESS_CHANGED';
CREATE TYPE "WalletInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'CANCELLED');
ALTER TABLE "WalletMembership" ADD COLUMN "lastViewedAt" TIMESTAMP(3);
CREATE TABLE "WalletInvitation" (
  "id" UUID NOT NULL,
  "walletId" UUID NOT NULL,
  "invitedById" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "status" "WalletInvitationStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "WalletInvitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WalletInvitation_tokenHash_key" ON "WalletInvitation"("tokenHash");
CREATE INDEX "WalletInvitation_walletId_status_idx" ON "WalletInvitation"("walletId", "status");
CREATE INDEX "WalletInvitation_email_status_idx" ON "WalletInvitation"("email", "status");
ALTER TABLE "WalletInvitation" ADD CONSTRAINT "WalletInvitation_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WalletInvitation" ADD CONSTRAINT "WalletInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
