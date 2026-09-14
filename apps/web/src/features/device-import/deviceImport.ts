import type { CreateWalletTransaction } from "@saving-account/contracts";
import { transactionStorageRawRead } from "../transactions";
import { savingsGoalStorageRawRead } from "../savings";

export const DEVICE_IMPORT_MARKER_KEY = "pocka-device-import-v1";
const DEVICE_IMPORT_DRAFT_KEY = "pocka-device-import-draft-v1";

export type DeviceImportItem = CreateWalletTransaction & {
  sourceIndex: number;
};
export type DeviceImportPreview = {
  items: DeviceImportItem[];
  invalidIndexes: number[];
  savingsGoal: number | null;
};

export function deviceImportPreviewRead(
  storage: Storage = localStorage,
): DeviceImportPreview | null {
  if (storage.getItem(DEVICE_IMPORT_MARKER_KEY)) return null;
  let values: unknown[];
  try {
    const parsed: unknown = JSON.parse(
      transactionStorageRawRead(storage) ?? "[]",
    );
    values = Array.isArray(parsed) ? parsed : [];
  } catch {
    values = [];
  }
  let operationIds: string[] = [];
  try {
    const savedDraft: unknown = JSON.parse(
      storage.getItem(DEVICE_IMPORT_DRAFT_KEY) ?? "[]",
    );
    if (
      Array.isArray(savedDraft) &&
      savedDraft.every((id) => typeof id === "string")
    )
      operationIds = savedDraft;
  } catch {
    // A corrupt draft only regenerates idempotency keys before import starts.
  }
  const invalidIndexes: number[] = [];
  const items = values.flatMap((value, sourceIndex): DeviceImportItem[] => {
    if (
      typeof value !== "object" ||
      value === null ||
      !("title" in value) ||
      !("category" in value) ||
      !("amount" in value) ||
      !("type" in value) ||
      !("createdAt" in value) ||
      typeof value.title !== "string" ||
      !value.title.trim() ||
      value.title.trim().length > 200 ||
      typeof value.category !== "string" ||
      !value.category.trim() ||
      value.category.trim().length > 80 ||
      typeof value.amount !== "number" ||
      !Number.isFinite(value.amount) ||
      value.amount <= 0 ||
      !["income", "expense", "saving"].includes(String(value.type)) ||
      typeof value.createdAt !== "string" ||
      !Number.isFinite(Date.parse(value.createdAt))
    ) {
      invalidIndexes.push(sourceIndex);
      return [];
    }
    const date = new Date(value.createdAt);
    const amount = Math.round(value.amount * 100);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      invalidIndexes.push(sourceIndex);
      return [];
    }
    operationIds[sourceIndex] ??= crypto.randomUUID();
    return [
      {
        sourceIndex,
        operationId: operationIds[sourceIndex],
        title: value.title.trim(),
        category: value.category.trim(),
        amount,
        type: value.type as DeviceImportItem["type"],
        occurredOn: date.toLocaleDateString("sv-SE", {
          timeZone: "Asia/Bangkok",
        }),
        occurredTime: new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Bangkok",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(date),
      },
    ];
  });
  storage.setItem(DEVICE_IMPORT_DRAFT_KEY, JSON.stringify(operationIds));
  const goalBaht = Number(savingsGoalStorageRawRead(storage));
  const savingsGoal =
    Number.isFinite(goalBaht) && goalBaht > 0
      ? Math.round(goalBaht * 100)
      : null;
  return items.length || invalidIndexes.length || savingsGoal
    ? { items, invalidIndexes, savingsGoal }
    : null;
}

export function deviceImportComplete(storage: Storage = localStorage) {
  storage.setItem(DEVICE_IMPORT_MARKER_KEY, new Date().toISOString());
  storage.removeItem(DEVICE_IMPORT_DRAFT_KEY);
}
