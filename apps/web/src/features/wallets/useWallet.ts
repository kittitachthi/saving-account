import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CreateWalletTransaction,
  EditWalletTransaction,
  DeleteWalletTransaction,
  WalletUndoReceipt,
  WalletSnapshot,
  WalletTransactionType,
} from "@saving-account/contracts";
import { authenticatedRequest, ApiError } from "../auth";

export function useWallet(
  walletId: string,
  onSessionEnded: () => void,
  onPrivacyRequired: () => void,
) {
  const [snapshot, setSnapshot] = useState<WalletSnapshot | null>(null);
  const [filter, setFilterState] = useState<"all" | WalletTransactionType>(
    "all",
  );
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  const alive = useRef(true);
  const mutation = useRef(false);
  const retry = useRef<{ fingerprint: string; operationId: string } | null>(
    null,
  );
  const accessError = useCallback(
    (error: unknown) => {
      if (!(error instanceof ApiError)) return false;
      if (error.status === 401) {
        setSnapshot(null);
        onSessionEnded();
        return true;
      }
      if (error.code === "PRIVACY_REQUIRED") {
        setSnapshot(null);
        onPrivacyRequired();
        return true;
      }
      if (error.code === "WALLET_FORBIDDEN") {
        setSnapshot(null);
        setError("ไม่สามารถเข้าถึงกระเป๋านี้ได้");
        return true;
      }
      return false;
    },
    [onSessionEnded, onPrivacyRequired],
  );
  const reload = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    try {
      const response = await authenticatedRequest(
        `/api/wallets/${walletId}?filter=${filter}&page=${page}`,
        { signal: controller.signal },
      );
      const data = (await response.json()) as WalletSnapshot;
      if (alive.current && !controller.signal.aborted) {
        setSnapshot(data);
        setError("");
      }
    } catch (error) {
      if (alive.current && !controller.signal.aborted && !accessError(error))
        setError("โหลดข้อมูลล่าสุดไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  }, [walletId, filter, page, accessError]);
  const latestReload = useRef(reload);
  useEffect(() => {
    latestReload.current = reload;
  }, [reload]);
  useEffect(() => {
    alive.current = true;
    let active = true;
    queueMicrotask(() => {
      if (active) void reload();
    });
    const refresh = () => {
      if (document.visibilityState === "visible" && !mutation.current)
        void reload();
    };
    const interval = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      alive.current = false;
      request.current?.abort();
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [reload]);
  useEffect(() => {
    if (!snapshot) return;
    const timer = setTimeout(
      () => {
        if (!mutation.current) void reload();
      },
      Math.max(1000, Date.parse(snapshot.nextDayAt) - Date.now() + 50),
    );
    return () => clearTimeout(timer);
  }, [snapshot, reload]);

  const write = async (
    path: string,
    method: string,
    body: unknown,
    refresh: "wait" | "background" = "wait",
  ) => {
    if (mutation.current) throw new Error("กำลังบันทึก กรุณารอสักครู่");
    mutation.current = true;
    setBusy(true);
    request.current?.abort();
    try {
      const response = await authenticatedRequest(
        `/api/wallets/${walletId}/${path}`,
        {
          method,
          body: JSON.stringify(body),
        },
      );
      if (alive.current) {
        if (refresh === "wait") await latestReload.current();
        else void latestReload.current();
      }
      return response;
    } catch (error) {
      if (
        alive.current &&
        !accessError(error) &&
        error instanceof ApiError &&
        error.code === "TRANSACTION_CHANGED"
      )
        await latestReload.current();
      throw error;
    } finally {
      mutation.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const add = async (input: Omit<CreateWalletTransaction, "operationId">) => {
    const fingerprint = JSON.stringify(input);
    if (retry.current?.fingerprint !== fingerprint)
      retry.current = { fingerprint, operationId: crypto.randomUUID() };
    await write("transactions", "POST", {
      ...input,
      operationId: retry.current.operationId,
    });
    retry.current = null;
  };
  return {
    snapshot,
    error,
    busy,
    reload,
    filter,
    page,
    setPage,
    setFilter: (value: typeof filter) => {
      setFilterState(value);
      setPage(1);
    },
    add,
    edit: async (id: string, input: EditWalletTransaction) => {
      await write(`transactions/${id}`, "PATCH", input);
    },
    remove: async (id: string, input: DeleteWalletTransaction) => {
      const started = performance.now();
      const response = await write(
        `transactions/${id}`,
        "DELETE",
        input,
        "background",
      );
      const receipt = (await response.json()) as WalletUndoReceipt;
      // Deduct the round trip conservatively; the server remains the deadline authority.
      return {
        ...receipt,
        remainingMs: Math.max(
          0,
          Date.parse(receipt.undoUntil) -
            Date.parse(receipt.serverTime) -
            (performance.now() - started),
        ),
      };
    },
    restore: async (id: string, operationId: string) => {
      await write(`transactions/${id}/restore`, "POST", { operationId });
    },
    setGoal: async (amount: number) => {
      await write("savings-goal", "PUT", { amount });
    },
  };
}
