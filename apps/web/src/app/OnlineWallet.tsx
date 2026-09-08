import { useRef, useState } from "react";
import type { AuthenticatedUser } from "@saving-account/contracts";
import { AppShell } from "./AppShell";
import { FinancialOverview } from "./FinancialOverview";
import { DashboardSummary, useDashboardMascot } from "../features/dashboard";
import { TransactionForm, TransactionPanel } from "../features/transactions";
import { CategoryChart } from "../features/category-chart";
import { SavingsChart, SavingsGoalForm } from "../features/savings";
import { LogoutConfirmation } from "../features/account";
import { SettingsSurface } from "../features/settings";
import { useTheme } from "../features/theme";
import { useWallet, presentWallet } from "../features/wallets";
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
  const [goalOpen, setGoalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const restoreFocus = useRef<() => void>(() => {});
  const { theme, toggleTheme } = useTheme();
  const mascot = useDashboardMascot();
  const snapshot = wallet.snapshot;
  const view = snapshot ? presentWallet(snapshot) : null;
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
          onSetGoal={() => setGoalOpen(true)}
          onAdd={() => setEntryOpen(true)}
          disabled={wallet.busy}
          notice={
            <div className={styles.notice}>
              <p>กระเป๋าส่วนตัว · {snapshot.wallet.name} · เวลา Asia/Bangkok</p>
              <p>
                ข้อมูลเดิมในอุปกรณ์ยังคงเก็บไว้ การนำเข้าจะเปิดให้ใช้งานภายหลัง
              </p>
              <p>การแก้ไขและลบรายการออนไลน์: เร็ว ๆ นี้</p>
              {wallet.error && <p role="alert">{wallet.error}</p>}
              <button
                disabled={wallet.busy}
                onClick={() => void wallet.reload()}
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
            onFilter={wallet.setFilter}
            page={snapshot.page}
            now={new Date()}
            onPage={wallet.setPage}
            newItemId={null}
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
              <button onClick={() => void wallet.reload()}>ลองใหม่</button>
            </>
          ) : (
            <p role="status">กำลังโหลดกระเป๋าส่วนตัว…</p>
          )}
        </main>
      )}
      {entryOpen && view && snapshot && (
        <TransactionForm
          availableBalance={view.totals.balance}
          walletToday={snapshot.today}
          onClose={() => setEntryOpen(false)}
          onAdd={async (item) => {
            try {
              await wallet.add({
                title: item.title,
                category: item.category,
                type: item.type,
                amount: item.amountSatang!,
                occurredOn: item.occurredOn!,
                occurredTime: item.occurredTime ?? null,
              });
              mascot.reactToResult(item.type);
              return true;
            } catch (error) {
              mascot.reactToResult("error");
              throw error;
            }
          }}
        />
      )}
      {goalOpen && view && (
        <SavingsGoalForm
          currentGoal={view.goal}
          onlineSave={wallet.setGoal}
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
