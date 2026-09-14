import { useEffect, useRef, useState } from "react";
import type { AuthenticatedUser } from "@saving-account/contracts";
import { AppShell } from "./AppShell";
import { FinancialOverview } from "./FinancialOverview";
import { DashboardSummary, useDashboardMascot } from "../features/dashboard";
import {
  TransactionForm,
  TransactionPanel,
  DeleteConfirmation,
  UndoToast,
  type Transaction,
} from "../features/transactions";
import { CategoryChart } from "../features/category-chart";
import { SavingsChart, SavingsGoalForm } from "../features/savings";
import {
  AccountDeletionConfirmation,
  LogoutConfirmation,
  SessionManager,
} from "../features/account";
import { SettingsSurface } from "../features/settings";
import { useTheme } from "../features/theme";
import {
  useWallet,
  walletSnapshotPresent,
  WalletSharingPanel,
} from "../features/wallets";
import { authenticatedRequest } from "../features/auth";
import {
  DeviceImportDialog,
  deviceImportComplete,
  deviceImportPreviewRead,
} from "../features/device-import";
import styles from "./OnlineWallet.module.css";
import { Button } from "../shared/ui/Button";

export function OnlineWallet({
  user,
  onLogout,
  onSessionEnded,
  onPrivacyRequired,
}: {
  user: AuthenticatedUser;
  onLogout: () => Promise<void>;
  onSessionEnded: () => void;
  onPrivacyRequired: () => void;
}) {
  const [walletId, setWalletId] = useState(user.personalWalletId);
  const [viewerObscured, setViewerObscured] = useState(
    document.visibilityState !== "visible",
  );
  const [sharingOpen, setSharingOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [accountRecovered] = useState(
    () =>
      new URLSearchParams(window.location.search).get("accountRecovered") ===
      "1",
  );
  const [deviceImportPreview, setDeviceImportPreview] = useState(
    deviceImportPreviewRead,
  );
  const sharingTrigger = useRef<HTMLElement | null>(null);
  const wallet = useWallet(walletId, onSessionEnded, onPrivacyRequired);
  useEffect(() => {
    if (accountRecovered) {
      const url = new URL(window.location.href);
      url.searchParams.delete("accountRecovered");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    }
    const invitation = new URLSearchParams(window.location.search).get(
      "invitation",
    );
    void (async () => {
      if (invitation) {
        try {
          const previewResponse = await authenticatedRequest(
            "/api/wallets/invitations/preview",
            { method: "POST", body: JSON.stringify({ token: invitation }) },
          );
          const preview = (await previewResponse.json()) as {
            walletName: string;
            owner: { displayName: string; email: string };
          };
          if (
            window.confirm(
              `ยอมรับคำเชิญดู Wallet “${preview.walletName}” แบบอ่านอย่างเดียวจาก ${preview.owner.displayName} (${preview.owner.email}) หรือไม่?`,
            )
          ) {
            const response = await authenticatedRequest(
              "/api/wallets/invitations/accept",
              { method: "POST", body: JSON.stringify({ token: invitation }) },
            );
            const accepted = (await response.json()) as { walletId: string };
            setWalletId(accepted.walletId);
            window.history.replaceState({}, "", window.location.pathname);
          }
        } catch {
          setActionError(
            "เปิดคำเชิญไม่ได้ คำเชิญอาจหมดอายุ ถูกยกเลิก ใช้แล้ว หรือไม่ตรงกับบัญชีนี้",
          );
        }
      }
    })();
  }, [accountRecovered]);
  useEffect(() => {
    const handleWalletVisibilityChange = () =>
      setViewerObscured(document.visibilityState !== "visible");
    document.addEventListener("visibilitychange", handleWalletVisibilityChange);
    return () =>
      document.removeEventListener(
        "visibilitychange",
        handleWalletVisibilityChange,
      );
  }, []);
  const [entryOpen, setEntryOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<{
    item: Transaction;
    operationId: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [undo, setUndo] = useState<{
    id: string;
    operationId: string;
    expiresAt: number;
  } | null>(null);
  const [undoPending, setUndoPending] = useState(false);
  const transactionFocus = useRef<HTMLElement | null>(null);
  const refreshButton = useRef<HTMLButtonElement>(null);
  const transactionDialogClose = () => {
    setEditing(null);
    setEntryOpen(false);
    setDeleting(null);
    queueMicrotask(() => transactionFocus.current?.focus());
  };
  useEffect(() => {
    if (!undo || undoPending) return;
    const timer = setTimeout(
      () => {
        if (document.activeElement?.closest('[aria-label="ผลการลบรายการ"]'))
          refreshButton.current?.focus();
        setUndo(null);
      },
      Math.max(0, undo.expiresAt - performance.now()),
    );
    return () => clearTimeout(timer);
  }, [undo, undoPending]);
  const [goalOpen, setGoalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [accountDeletionOpen, setAccountDeletionOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const restoreFocus = useRef<() => void>(() => {});
  const { theme, toggleTheme } = useTheme();
  const mascot = useDashboardMascot();
  const snapshot = wallet.snapshot;
  const view = snapshot ? walletSnapshotPresent(snapshot) : null;
  const selectedWallet = snapshot?.wallet;
  const owner = selectedWallet?.role === "owner";
  return (
    <AppShell
      displayName={user.displayName}
      email={user.email}
      avatarUrl={user.avatarUrl}
      onOpenSettings={() => setSettingsOpen(true)}
      onRequestLogout={(restore) => {
        restoreFocus.current = restore;
        setLogoutError(null);
        setLogoutOpen(true);
      }}
    >
      {snapshot && view && selectedWallet ? (
        <div
          className={`${styles["wallet-view"]} ${!owner ? styles["wallet-viewer-view"] : ""} ${!owner && viewerObscured ? styles["wallet-obscured-view"] : ""}`}
        >
          <FinancialOverview
            displayName={user.displayName}
            hasGoal={view.goal !== null}
            onSavingsGoalEditRequest={
              owner ? () => setGoalOpen(true) : undefined
            }
            onTransactionCreateRequest={
              owner ? () => setEntryOpen(true) : undefined
            }
            onWalletSharingOpenRequest={() => {
              sharingTrigger.current = document.activeElement as HTMLElement;
              setSharingOpen(true);
            }}
            walletSharingLabel={
              owner ? "จัดการการแชร์" : "ข้อมูล Wallet ที่แชร์"
            }
            disabled={wallet.busy}
            notice={
              <div className={styles["online-wallet-status-notice"]}>
                <p>
                  {owner
                    ? "กระเป๋าส่วนตัว"
                    : `กระเป๋าที่แชร์โดย ${snapshot.wallet.owner.displayName}`}{" "}
                  · {snapshot.wallet.name} · เวลา Asia/Bangkok
                </p>
                <p>ข้อมูลเดิมในอุปกรณ์จะไม่ถูกลบโดยการนำเข้า</p>
                {accountRecovered && (
                  <p role="status">
                    กู้คืนบัญชีและกระเป๋าส่วนตัวแล้ว
                    การแชร์และคำเชิญเดิมไม่ได้ถูกกู้คืน
                  </p>
                )}
                {actionError && <p role="alert">{actionError}</p>}
                {wallet.error && <p role="alert">{wallet.error}</p>}
                <button
                  ref={refreshButton}
                  disabled={wallet.busy}
                  onClick={() => void wallet.walletSnapshotReload()}
                >
                  รีเฟรชข้อมูล
                </button>
              </div>
            }
            summary={
              <DashboardSummary
                moneyUnit="satang"
                totals={view.totals}
                transactions={[]}
                now={new Date()}
                mascotState={mascot.state}
                online={{ monthly: view.monthly, daily: view.daily }}
              />
            }
          >
            <TransactionPanel
              moneyUnit="satang"
              showUpdatedAt={!owner}
              transactions={view.transactions}
              filter={wallet.filter}
              onTransactionFilterChange={wallet.transactionFilterChange}
              page={snapshot.page}
              now={new Date()}
              onTransactionPageChange={wallet.transactionPageChange}
              newItemId={null}
              actionsDisabled={wallet.busy}
              onTransactionEditRequest={
                owner
                  ? (item) => {
                      transactionFocus.current =
                        document.activeElement as HTMLElement;
                      setEditing(item);
                    }
                  : undefined
              }
              onTransactionDeleteRequest={
                owner
                  ? (item) => {
                      transactionFocus.current =
                        document.activeElement as HTMLElement;
                      setDeleteError("");
                      setActionError("");
                      setDeleting({ item, operationId: crypto.randomUUID() });
                    }
                  : undefined
              }
              serverPagination={{
                page: snapshot.page,
                totalPages: snapshot.totalPages,
              }}
            />
            <CategoryChart
              moneyUnit="satang"
              transactions={[]}
              expenseTotal={view.monthly.expense}
              serverSummaries={view.expenseCategories}
            />
            <SavingsChart
              moneyUnit="satang"
              transactions={[]}
              saved={view.totals.saving}
              goal={view.goal}
              onSetGoal={owner ? () => setGoalOpen(true) : undefined}
              serverCategories={view.savingsCategories}
            />
          </FinancialOverview>
        </div>
      ) : (
        <main className={styles["online-wallet-loading-container"]}>
          {wallet.error ? (
            <>
              <p role="alert">{wallet.error}</p>
              <button onClick={() => void wallet.walletSnapshotReload()}>
                ลองใหม่
              </button>
            </>
          ) : (
            <p role="status">กำลังโหลดกระเป๋าส่วนตัว…</p>
          )}
        </main>
      )}
      {owner && (entryOpen || editing) && view && snapshot && (
        <TransactionForm
          initialTransaction={editing ?? undefined}
          availableBalance={view.totals.balance}
          walletToday={snapshot.today}
          onTransactionFormClose={transactionDialogClose}
          onTransactionSubmit={async (item) => {
            try {
              const input = {
                title: item.title,
                category: item.category,
                type: item.type,
                amount: item.amountSatang!,
                occurredOn: item.occurredOn!,
                occurredTime: item.occurredTime ?? null,
              };
              if (editing) {
                const { type: _type, ...fields } = input;
                await wallet.transactionUpdate(String(editing.id), {
                  ...fields,
                  expectedUpdatedAt: editing.updatedAt!,
                });
              } else await wallet.transactionCreate(input);
              mascot.reactToResult(item.type);
              return true;
            } catch (error) {
              mascot.reactToResult("error");
              throw error;
            }
          }}
        />
      )}
      {deleting && (
        <DeleteConfirmation
          transaction={deleting.item}
          moneyUnit="satang"
          pending={wallet.busy}
          error={deleteError}
          onTransactionDeleteCancel={transactionDialogClose}
          onTransactionDeleteConfirm={() => {
            if (wallet.busy) return;
            void wallet
              .transactionDelete(String(deleting.item.id), {
                operationId: deleting.operationId,
                expectedUpdatedAt: deleting.item.updatedAt!,
              })
              .then((receipt) => {
                setDeleting(null);
                if (receipt.remainingMs > 0)
                  setUndo({
                    id: String(deleting.item.id),
                    operationId: receipt.operationId,
                    expiresAt: performance.now() + receipt.remainingMs,
                  });
                else {
                  setUndo(null);
                  refreshButton.current?.focus();
                }
              })
              .catch((error: unknown) =>
                setDeleteError(
                  error instanceof Error ? error.message : "ลบรายการไม่สำเร็จ",
                ),
              );
          }}
        />
      )}
      {undo && (
        <UndoToast
          key={undo.operationId}
          autoFocus
          pending={undoPending || wallet.busy}
          onTransactionDeleteUndo={() => {
            if (undoPending || wallet.busy) return;
            setUndoPending(true);
            setActionError("");
            void wallet
              .transactionRestore(undo.id, undo.operationId)
              .then(() => {
                setUndo(null);
                refreshButton.current?.focus();
              })
              .catch((error: unknown) => {
                setActionError(
                  error instanceof Error ? error.message : "คืนรายการไม่สำเร็จ",
                );
              })
              .finally(() => setUndoPending(false));
          }}
        />
      )}
      {owner && goalOpen && view && (
        <SavingsGoalForm
          currentGoal={view.goal}
          onlineSave={wallet.savingsGoalUpdate}
          onClose={() => setGoalOpen(false)}
        />
      )}
      {sharingOpen && snapshot && selectedWallet && (
        <WalletSharingPanel
          wallets={snapshot.availableWallets ?? [selectedWallet]}
          wallet={selectedWallet}
          onWalletChange={(nextWalletId) => {
            setWalletId(nextWalletId);
            setSharingOpen(false);
          }}
          onAccessEnded={() => {
            setWalletId(user.personalWalletId);
            setSharingOpen(false);
          }}
          onClose={() => {
            setSharingOpen(false);
            queueMicrotask(() => sharingTrigger.current?.focus());
          }}
          walletRequest={authenticatedRequest}
        />
      )}
      {settingsOpen && (
        <SettingsSurface
          theme={theme}
          onThemeToggleRequest={toggleTheme}
          onSettingsCloseRequest={() => setSettingsOpen(false)}
          accountSettings={
            <>
              <SessionManager onSessionEnded={onSessionEnded} />
              <Button
                variant="destructive"
                onClick={() => setAccountDeletionOpen(true)}
              >
                ขอลบบัญชี
              </Button>
            </>
          }
        />
      )}
      {owner && deviceImportPreview && (
        <DeviceImportDialog
          walletId={walletId}
          preview={deviceImportPreview}
          onDeviceImportCancel={() => {
            deviceImportComplete();
            setDeviceImportPreview(null);
          }}
          onDeviceImportComplete={() => {
            setDeviceImportPreview(null);
            void wallet.walletSnapshotReload();
          }}
        />
      )}
      {logoutOpen && (
        <LogoutConfirmation
          pending={logoutPending}
          error={logoutError}
          onCancel={() => {
            setLogoutOpen(false);
            queueMicrotask(restoreFocus.current);
          }}
          onConfirm={() => {
            if (logoutPending) return;
            setLogoutPending(true);
            setLogoutError(null);
            void onLogout().catch(() => {
              setLogoutPending(false);
              setLogoutError("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
            });
          }}
        />
      )}
      {accountDeletionOpen && (
        <AccountDeletionConfirmation
          onAccountDeletionCancel={() => setAccountDeletionOpen(false)}
          onAccountDeletionComplete={onSessionEnded}
        />
      )}
    </AppShell>
  );
}
