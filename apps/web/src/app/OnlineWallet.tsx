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
import { LogoutConfirmation } from "../features/account";
import { SettingsSurface } from "../features/settings";
import { useTheme } from "../features/theme";
import { useWallet, walletSnapshotPresent } from "../features/wallets";
import styles from "./OnlineWallet.module.css";

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
  const wallet = useWallet(
    user.personalWalletId,
    onSessionEnded,
    onPrivacyRequired,
  );
  const [entryOpen, setEntryOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<{
    item: Transaction;
    operationId: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [actionError, setActionError] = useState("");
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
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const restoreFocus = useRef<() => void>(() => {});
  const { theme, toggleTheme } = useTheme();
  const mascot = useDashboardMascot();
  const snapshot = wallet.snapshot;
  const view = snapshot ? walletSnapshotPresent(snapshot) : null;
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
      {snapshot && view ? (
        <FinancialOverview
          displayName={user.displayName}
          hasGoal={view.goal !== null}
          onSavingsGoalEditRequest={() => setGoalOpen(true)}
          onTransactionCreateRequest={() => setEntryOpen(true)}
          disabled={wallet.busy}
          notice={
            <div className={styles.notice}>
              <p>กระเป๋าส่วนตัว · {snapshot.wallet.name} · เวลา Asia/Bangkok</p>
              <p>
                ข้อมูลเดิมในอุปกรณ์ยังคงเก็บไว้ การนำเข้าจะเปิดให้ใช้งานภายหลัง
              </p>
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
            transactions={view.transactions}
            filter={wallet.filter}
            onTransactionFilterChange={wallet.transactionFilterChange}
            page={snapshot.page}
            now={new Date()}
            onTransactionPageChange={wallet.transactionPageChange}
            newItemId={null}
            actionsDisabled={wallet.busy}
            onTransactionEditRequest={(item) => {
              transactionFocus.current = document.activeElement as HTMLElement;
              setEditing(item);
            }}
            onTransactionDeleteRequest={(item) => {
              transactionFocus.current = document.activeElement as HTMLElement;
              setDeleteError("");
              setActionError("");
              setDeleting({ item, operationId: crypto.randomUUID() });
            }}
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
            onSetGoal={() => setGoalOpen(true)}
            serverCategories={view.savingsCategories}
          />
        </FinancialOverview>
      ) : (
        <main className={styles.loading}>
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
      {(entryOpen || editing) && view && snapshot && (
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
      {goalOpen && view && (
        <SavingsGoalForm
          currentGoal={view.goal}
          onlineSave={wallet.savingsGoalUpdate}
          onClose={() => setGoalOpen(false)}
        />
      )}
      {settingsOpen && (
        <SettingsSurface
          theme={theme}
          onToggleTheme={toggleTheme}
          onClose={() => setSettingsOpen(false)}
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
    </AppShell>
  );
}
