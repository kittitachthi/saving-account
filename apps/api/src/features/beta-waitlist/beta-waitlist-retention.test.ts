import { describe, expect, it, vi } from "vitest";
import {
  BETA_WAITLIST_RETENTION_MS,
  betaWaitlistExpiredEntriesDelete,
} from "./beta-waitlist-retention.js";

describe("beta Waitlist retention", () => {
  it("deletes only pending or declined entries at least 180 days old", async () => {
    const deleteMany = vi.fn(async () => ({ count: 2 }));
    const now = new Date("2030-09-14T00:00:00Z");
    const count = await betaWaitlistExpiredEntriesDelete(
      { betaWaitlistEntry: { deleteMany } } as never,
      now,
    );
    expect(count).toBe(2);
    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        status: { in: ["PENDING", "DECLINED"] },
        requestedAt: {
          lte: new Date(now.getTime() - BETA_WAITLIST_RETENTION_MS),
        },
      },
    });
  });
});
