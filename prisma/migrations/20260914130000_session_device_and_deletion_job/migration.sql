ALTER TABLE "Session" ADD COLUMN "deviceLabel" TEXT NOT NULL DEFAULT 'อุปกรณ์ไม่ทราบชนิด';

CREATE TABLE "AccountDeletionJob" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountDeletionJob_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AccountDeletionJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AccountDeletionJob_userId_key" ON "AccountDeletionJob"("userId");
CREATE INDEX "AccountDeletionJob_dueAt_idx" ON "AccountDeletionJob"("dueAt");
