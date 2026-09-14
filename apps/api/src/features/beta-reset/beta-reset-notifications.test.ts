import { describe, expect, it, vi } from "vitest";
import {
  betaResetBackupDeleteAfterCalculate,
  betaResetNotificationsSchedule,
} from "./beta-reset-notifications.js";

describe("beta reset notifications", () => {
  it("schedules deduplicated notices exactly 14 and 3 days before reset", async () => {
    const createMany = vi.fn(async () => ({ count: 2 }));
    const client = {
      user: { findMany: vi.fn(async () => [{ email: "tester@example.com" }]) },
      notificationOutbox: { createMany },
    } as never;
    const now = new Date("2030-01-01T00:00:00Z");
    const resetAt = new Date("2030-01-18T00:00:00Z");
    await betaResetNotificationsSchedule(client, resetAt, now);
    expect(createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skipDuplicates: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            nextAttemptAt: new Date("2030-01-04T00:00:00Z"),
          }),
          expect.objectContaining({
            nextAttemptAt: new Date("2030-01-15T00:00:00Z"),
          }),
        ]),
      }),
    );
    expect(betaResetBackupDeleteAfterCalculate(resetAt)).toEqual(
      new Date("2030-02-17T00:00:00Z"),
    );
  });

  it("rejects a reset with less than 14 days notice", async () => {
    await expect(
      betaResetNotificationsSchedule(
        {} as never,
        new Date("2030-01-14T23:59:59Z"),
        new Date("2030-01-01T00:00:00Z"),
      ),
    ).rejects.toThrow("14 days");
  });
});
