import { describe, expect, it, vi } from "vitest";
import { deviceImportComplete, deviceImportPreviewRead } from "./deviceImport";

describe("device import", () => {
  it("keeps stable operation IDs, reports invalid rows and marks only completion", () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => "00000000-0000-4000-8000-000000000001"),
    });
    localStorage.setItem(
      "daily-money-transactions-v2",
      JSON.stringify([
        {
          id: 1,
          title: "เงินเดือน",
          category: "งาน",
          amount: 100,
          type: "income",
          createdAt: "2030-01-02T03:04:00Z",
        },
        { broken: true },
      ]),
    );
    localStorage.setItem("daily-money-savings-goal-v1", "500");
    const first = deviceImportPreviewRead()!;
    expect(first.items[0]).toMatchObject({
      amount: 10000,
      operationId: "00000000-0000-4000-8000-000000000001",
    });
    expect(first.invalidIndexes).toEqual([1]);
    expect(first.savingsGoal).toBe(50000);
    expect(deviceImportPreviewRead()!.items[0].operationId).toBe(
      first.items[0].operationId,
    );
    deviceImportComplete();
    expect(deviceImportPreviewRead()).toBeNull();
    expect(localStorage.getItem("daily-money-transactions-v2")).not.toBeNull();
  });
});
