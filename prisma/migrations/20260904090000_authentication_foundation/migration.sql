CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE');
CREATE TYPE "WalletRole" AS ENUM ('OWNER', 'VIEWER');

CREATE TABLE "User" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "AuthAccount" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "provider" "AuthProvider" NOT NULL,
  "providerSubject" TEXT NOT NULL,
  "verifiedEmail" TEXT NOT NULL,
  CONSTRAINT "AuthAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AuthAccount_provider_providerSubject_key" ON "AuthAccount"("provider", "providerSubject");

CREATE TABLE "Wallet" (
  "id" UUID NOT NULL,
  "ownerId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WalletMembership" (
  "walletId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "role" "WalletRole" NOT NULL,
  CONSTRAINT "WalletMembership_pkey" PRIMARY KEY ("walletId", "userId")
);

CREATE TABLE "Session" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

CREATE TABLE "BetaAllowlist" (
  "email" TEXT NOT NULL,
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "addedBy" TEXT NOT NULL,
  CONSTRAINT "BetaAllowlist_pkey" PRIMARY KEY ("email")
);

CREATE TABLE "OAuthAttempt" (
  "stateHash" TEXT NOT NULL,
  "nonce" TEXT NOT NULL,
  "codeVerifier" TEXT NOT NULL,
  "returnTo" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OAuthAttempt_pkey" PRIMARY KEY ("stateHash")
);

ALTER TABLE "AuthAccount" ADD CONSTRAINT "AuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WalletMembership" ADD CONSTRAINT "WalletMembership_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WalletMembership" ADD CONSTRAINT "WalletMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
