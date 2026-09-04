import { useState } from "react";
import styles from "./App.module.css";
import { AppShell } from "./app/AppShell";
import { DashboardSummary } from "./features/dashboard";
import { CategoryChart } from "./features/category-chart";
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

type AppProps = { displayName?: string };

export default function App({ displayName = "กิตติ" }: AppProps) {
  const [entryOpen, setEntryOpen] = useState(false),
    [goalOpen, setGoalOpen] = useState(false),
    [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const transactions = useTransactions(seedTransactions);
  const savings = useSavingsGoal();
  return (
    <AppShell
      displayName={displayName}
      onOpenSettings={() => setSettingsOpen(true)}
    >
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>สวัสดี, {displayName} 👋</h1>
            <p>นี่คือภาพรวมการเงินของคุณในเดือนนี้</p>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.secondary}
              onClick={() => setGoalOpen(true)}
            >
              ◎ {savings.goal ? "แก้ไขเป้าหมาย" : "ตั้งเป้าหมายเงินเก็บ"}
            </button>
            <button
              className={styles.primary}
              onClick={() => setEntryOpen(true)}
            >
              ＋ เพิ่มรายการ
            </button>
          </div>
        </header>
        <DashboardSummary
          totals={transactions.totals}
          transactions={transactions.transactions}
          now={transactions.now}
        />
        <section className={styles.content}>
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
        </section>
      </main>
      {entryOpen && (
        <TransactionForm
          onClose={() => setEntryOpen(false)}
          onAdd={transactions.addTransaction}
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
    </AppShell>
  );
}
