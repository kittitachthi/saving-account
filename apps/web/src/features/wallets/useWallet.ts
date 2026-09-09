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
  const walletAccessErrorHandle = useCallback(
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
  const walletSnapshotReload = useCallback(async () => {
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
      if (
        alive.current &&
        !controller.signal.aborted &&
        !walletAccessErrorHandle(error)
      )
        setError("โหลดข้อมูลล่าสุดไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  }, [walletId, filter, page, walletAccessErrorHandle]);
  const latestWalletSnapshotReload = useRef(walletSnapshotReload);
  useEffect(() => {
    latestWalletSnapshotReload.current = walletSnapshotReload;
  }, [walletSnapshotReload]);
  useEffect(() => {
    alive.current = true;
    let active = true;
    queueMicrotask(() => {
      if (active) void walletSnapshotReload();
    });
    const walletSnapshotAutoRefresh = () => {
      if (document.visibilityState === "visible" && !mutation.current)
        void walletSnapshotReload();
    };
    const interval = setInterval(walletSnapshotAutoRefresh, 30000);
    window.addEventListener("focus", walletSnapshotAutoRefresh);
    document.addEventListener("visibilitychange", walletSnapshotAutoRefresh);
    return () => {
      active = false;
      alive.current = false;
      request.current?.abort();
      clearInterval(interval);
      window.removeEventListener("focus", walletSnapshotAutoRefresh);
      document.removeEventListener(
        "visibilitychange",
        walletSnapshotAutoRefresh,
      );
    };
  }, [walletSnapshotReload]);
  useEffect(() => {
    if (!snapshot) return;
    const timer = setTimeout(
      () => {
        if (!mutation.current) void walletSnapshotReload();
      },
      Math.max(1000, Date.parse(snapshot.nextDayAt) - Date.now() + 50),
    );
    return () => clearTimeout(timer);
  }, [snapshot, walletSnapshotReload]);

  const walletMutationRequest = async (
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
        if (refresh === "wait") await latestWalletSnapshotReload.current();
        else void latestWalletSnapshotReload.current();
      }
      return response;
    } catch (error) {
      if (
        alive.current &&
        !walletAccessErrorHandle(error) &&
        error instanceof ApiError &&
        error.code === "TRANSACTION_CHANGED"
      )
        await latestWalletSnapshotReload.current();
      throw error;
    } finally {
      mutation.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const transactionCreate = async (
    input: Omit<CreateWalletTransaction, "operationId">,
  ) => {
    const fingerprint = JSON.stringify(input);
    if (retry.current?.fingerprint !== fingerprint)
      retry.current = { fingerprint, operationId: crypto.randomUUID() };
    await walletMutationRequest("transactions", "POST", {
      ...input,
      operationId: retry.current.operationId,
    });
    retry.current = null;
  };
  return {
    snapshot,
    error,
    busy,
    walletSnapshotReload,
    filter,
    page,
    transactionPageChange: setPage,
    transactionFilterChange: (value: typeof filter) => {
      setFilterState(value);
      setPage(1);
    },
    transactionCreate,
    transactionUpdate: async (id: string, input: EditWalletTransaction) => {
      await walletMutationRequest(`transactions/${id}`, "PATCH", input);
    },
    transactionDelete: async (id: string, input: DeleteWalletTransaction) => {
      const started = performance.now();
      const response = await walletMutationRequest(
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
    transactionRestore: async (id: string, operationId: string) => {
      await walletMutationRequest(`transactions/${id}/restore`, "POST", {
        operationId,
      });
    },
    savingsGoalUpdate: async (amount: number) => {
      await walletMutationRequest("savings-goal", "PUT", { amount });
    },
  };
}
