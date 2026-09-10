import type { PrismaClient } from "@prisma/client";
import pino from "pino";
import { describe, expect, it, vi } from "vitest";
import { createNotificationWorker } from "./notification-worker.js";

const job = {
  id: "8df9f28f-821f-4107-88b5-8255dde69b58",
  kind: "BETA_APPROVED",
  dedupeKey: "beta-approved:friend@example.com",
  recipientEmail: "friend@example.com",
  payload: { email: "friend@example.com" },
  status: "PENDING",
  attempts: 0,
  nextAttemptAt: new Date(0),
  sentAt: null,
  lastError: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
} as const;

function setup(send = vi.fn().mockResolvedValue(undefined)) {
  const notificationOutbox = {
    findFirst: vi.fn().mockResolvedValue(job),
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    update: vi.fn().mockResolvedValue(job),
  };
  const worker = createNotificationWorker({
    client: { notificationOutbox } as unknown as PrismaClient,
    transport: { send },
    appOrigin: "https://pocka.example",
    logger: pino({ level: "silent" }),
  });
  return { worker, send, notificationOutbox };
}

describe("notification worker", () => {
  it("sends an approved Beta invitation and marks it sent", async () => {
    const { worker, send, notificationOutbox } = setup();
    expect(await worker.notificationDeliveryProcessNext()).toBe(true);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: `<${job.id}@notifications.pocka.local>`,
        to: "friend@example.com",
        subject: "คุณได้รับสิทธิ์ทดลองใช้ Pocka แล้ว",
      }),
    );
    expect(notificationOutbox.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "SENT" }),
      }),
    );
  });

  it("retains a failed delivery for retry without throwing", async () => {
    const { worker, notificationOutbox } = setup(
      vi.fn().mockRejectedValue(new Error("SMTP unavailable")),
    );
    expect(await worker.notificationDeliveryProcessNext()).toBe(true);
    expect(notificationOutbox.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          attempts: 1,
          lastError: "Error",
        }),
      }),
    );
  });
});
