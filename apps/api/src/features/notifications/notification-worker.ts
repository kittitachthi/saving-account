import type { PrismaClient } from "@prisma/client";
import type { Logger } from "pino";

export type EmailMessage = {
  messageId: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type EmailTransport = { send(message: EmailMessage): Promise<void> };

export function createNotificationWorker({
  client,
  transport,
  appOrigin,
  logger,
}: {
  client: PrismaClient;
  transport: EmailTransport;
  appOrigin: string;
  logger: Logger;
}) {
  let timer: NodeJS.Timeout | undefined;
  let working = false;

  async function processNext() {
    if (working) return false;
    working = true;
    try {
      const now = new Date();
      const candidate = await client.notificationOutbox.findFirst({
        where: {
          nextAttemptAt: { lte: now },
          OR: [
            { status: { in: ["PENDING", "FAILED"] } },
            {
              status: "PROCESSING",
              updatedAt: { lt: new Date(now.getTime() - 5 * 60_000) },
            },
          ],
        },
        orderBy: { createdAt: "asc" },
      });
      if (!candidate) return false;

      const claimed = await client.notificationOutbox.updateMany({
        where: { id: candidate.id, updatedAt: candidate.updatedAt },
        data: { status: "PROCESSING" },
      });
      if (claimed.count !== 1) return false;

      try {
        const payload = candidate.payload as Record<string, string>;
        const common = {
          messageId: `<${candidate.id}@notifications.pocka.local>`,
          to: candidate.recipientEmail,
        };
        const message =
          candidate.kind === "BETA_APPROVED"
            ? {
                ...common,
                subject: "คุณได้รับสิทธิ์ทดลองใช้ Pocka แล้ว",
                text: `ยินดีต้อนรับสู่ Pocka คุณสามารถเข้าสู่ระบบด้วย Google ได้ที่ ${appOrigin}`,
                html: `<h1>ยินดีต้อนรับสู่ Pocka</h1><p>คำขอเข้าร่วม Private Beta ของคุณได้รับการอนุมัติแล้ว</p><p><a href="${appOrigin}">เข้าสู่ระบบด้วย Google</a></p>`,
              }
            : candidate.kind === "WALLET_INVITATION"
              ? {
                  ...common,
                  subject: "คำเชิญดู Wallet บน Pocka",
                  text: `คุณได้รับคำเชิญดู Wallet ${payload.walletName} แบบอ่านอย่างเดียว: ${payload.invitationUrl}`,
                  html: `<p>คุณได้รับคำเชิญดู Wallet แบบอ่านอย่างเดียว</p><p><a href="${payload.invitationUrl}">ตรวจและยอมรับคำเชิญ</a></p>`,
                }
              : {
                  ...common,
                  subject: "การเข้าถึง Wallet บน Pocka เปลี่ยนแปลง",
                  text: `สิทธิ์ของ ${payload.viewerEmail} เปลี่ยนแปลง: ${payload.action}`,
                  html: "<p>สิทธิ์การเข้าถึง Wallet บน Pocka เปลี่ยนแปลง</p>",
                };
        await transport.send(message);
        await client.notificationOutbox.update({
          where: { id: candidate.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            attempts: { increment: 1 },
            lastError: null,
          },
        });
        logger.info(
          { event: "notification_sent", notificationId: candidate.id },
          "notification sent",
        );
      } catch (error) {
        const attempts = candidate.attempts + 1;
        await client.notificationOutbox.update({
          where: { id: candidate.id },
          data: {
            status: "FAILED",
            attempts,
            lastError: error instanceof Error ? error.name : "UnknownError",
            nextAttemptAt: new Date(
              Date.now() + Math.min(60, 2 ** attempts) * 60_000,
            ),
          },
        });
        logger.warn(
          { event: "notification_failed", notificationId: candidate.id },
          "notification delivery failed",
        );
      }
      return true;
    } finally {
      working = false;
    }
  }

  return {
    processNext,
    start() {
      if (timer) return;
      timer = setInterval(() => void processNext(), 10_000);
      timer.unref();
      void processNext();
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = undefined;
    },
  };
}
