import { describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_RECOVERY_MS,
  expiredAccountDeletionProcessNext,
} from "./account-deletion-purge.js";

describe("expired Account deletion", () => {
  it("deletes only Accounts whose 30-day recovery period ended", async () => {
    const userDeleteMany = vi.fn(async () => ({ count: 1 }));
    const accountDeletionJobDeleteMany = vi.fn();
    const now = new Date("2030-02-01T00:00:00Z");
    const accountDeletionJob = {
      findFirst: vi.fn(async () => ({ id: "job-1", userId: "user-1" })),
    };
    const client = {
      accountDeletionJob,
      $transaction: vi.fn(async (run) =>
        run({
          user: { deleteMany: userDeleteMany },
          accountDeletionJob: { deleteMany: accountDeletionJobDeleteMany },
        }),
      ),
    };
    expect(
      await expiredAccountDeletionProcessNext(client as never, now),
    ).toBe(true);
    expect(userDeleteMany).toHaveBeenCalledWith({
      where: {
        id: "user-1",
        pendingDeletionAt: {
          not: null,
          lte: new Date(now.getTime() - ACCOUNT_RECOVERY_MS),
        },
      },
    });
    expect(accountDeletionJobDeleteMany).not.toHaveBeenCalled();
  });

  it("stops when no deletion job is due", async () => {
    const client = {
      accountDeletionJob: { findFirst: vi.fn(async () => null) },
      $transaction: vi.fn(),
    };
    expect(await expiredAccountDeletionProcessNext(client as never)).toBe(
      false,
    );
    expect(client.$transaction).not.toHaveBeenCalled();
  });
});
