ALTER TABLE "WalletTransaction"
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deleteOperationId" UUID;
