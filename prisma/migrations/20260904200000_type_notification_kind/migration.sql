CREATE TYPE "NotificationKind" AS ENUM ('BETA_APPROVED');
ALTER TABLE "NotificationOutbox"
ALTER COLUMN "kind" TYPE "NotificationKind"
USING ("kind"::"NotificationKind");
