import { useRef, useState } from "react";
import type { AuthenticatedUser } from "@saving-account/contracts";
import { FinancialOverview } from "./app/FinancialOverview";
import { AppShell } from "./app/AppShell";
import { DashboardSummary, useDashboardMascot } from "./features/dashboard";
import { CategoryChart } from "./features/category-chart";
import { LogoutConfirmation } from "./features/account";
import { SettingsSurface } from "./features/settings";
import {
  SavingsChart,
  SavingsGoalForm,
  useSavingsGoal,
} from "./features/savings";
import { useTheme } from "./features/theme";
import {
  DeleteConfirmation,
  seedTransactions,
  TransactionForm,
  TransactionPanel,
  UndoToast,
  useTransactions,
} from "./features/transactions";

type AppProps = {
  user?: AuthenticatedUser;
  onLogout?: () => Promise<void>;
};

const defaultUser: AuthenticatedUser = {
  id: "preview-user",
  displayName: "กิตติ",
  email: "kitti@example.com",
  avatarUrl: null,
  personalWalletId: "preview-wallet",
};

export default function App({
  user = defaultUser,
  onLogout = async () => undefined,
}: AppProps) {
  const [entryOpen, setEntryOpen] = useState(false),
    [goalOpen, setGoalOpen] = useState(false),
    [settingsOpen, setSettingsOpen] = useState(false),
    [logoutOpen, setLogoutOpen] = useState(false),
    [logoutPending, setLogoutPending] = useState(false),
    [logoutError, setLogoutError] = useState<string | null>(null);
  const restoreLogoutFocus = useRef<() => void>(() => undefined);
  const { theme, toggleTheme } = useTheme();
  const transactions = useTransactions(seedTransactions);
  const mascot = useDashboardMascot();
  const savings = useSavingsGoal();
  return (
    <AppShell
      displayName={user.displayName}
      email={user.email}
      avatarUrl={user.avatarUrl}
      onOpenSettings={() => setSettingsOpen(true)}
      onRequestLogout={(restoreFocus) => {
        restoreLogoutFocus.current = restoreFocus;
        setLogoutError(null);
        setLogoutOpen(true);
      }}
    >
      <FinancialOverview
        displayName={user.displayName}
        hasGoal={!!savings.goal}
        onSetGoal={() => setGoalOpen(true)}
        onAdd={() => setEntryOpen(true)}
        summary={
          <DashboardSummary
            totals={transactions.totals}
            transactions={transactions.transactions}
            now={transactions.now}
            mascotState={mascot.state}
          />
        }
      >
        <TransactionPanel
          transactions={transactions.transactions}
          filter={transactions.filter}
          newItemId={transactions.newItemId}
          onFilter={transactions.setFilter}
          onRequestDelete={transactions.setPendingDelete}
          page={transactions.page}
          now={transactions.now}
          onPage={transactions.setPage}
        />
        <CategoryChart
          transactions={transactions.transactions}
          expenseTotal={transactions.totals.expense}
        />
        <SavingsChart
          transactions={transactions.transactions}
          saved={transactions.totals.saving}
          goal={savings.goal}
          onSetGoal={() => setGoalOpen(true)}
        />
      </FinancialOverview>
      {entryOpen && (
        <TransactionForm
          onClose={() => setEntryOpen(false)}
          onAdd={(item) => {
            const saved = transactions.addTransaction(item);
            mascot.reactToResult(saved ? item.type : "error");
            return saved;
          }}
          availableBalance={transactions.totals.balance}
        />
      )}
      {goalOpen && (
        <SavingsGoalForm
          currentGoal={savings.goal}
          onSave={savings.setGoal}
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
      {transactions.pendingDelete && (
        <DeleteConfirmation
          transaction={transactions.pendingDelete}
          onCancel={() => transactions.setPendingDelete(null)}
          onConfirm={transactions.confirmDelete}
          error={transactions.deleteError}
        />
      )}
      {transactions.removed && <UndoToast onUndo={transactions.undoDelete} />}
      {logoutOpen && (
        <LogoutConfirmation
          pending={logoutPending}
          error={logoutError}
          onCancel={() => {
            setLogoutOpen(false);
            queueMicrotask(restoreLogoutFocus.current);
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
