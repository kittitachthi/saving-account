import { useState } from "react";
import styles from "./App.module.css";
import { AppShell } from "./app/AppShell";
import { DashboardSummary } from "./features/dashboard";
import { CategoryChart } from "./features/category-chart";
import { SettingsSurface } from "./features/settings";
import { useTheme } from "./features/theme";
import {
  DeleteConfirmation,
  seedTransactions,
  TransactionForm,
  TransactionPanel,
  UndoToast,
  useTransactions,
} from "./features/transactions";

export default function App() {
  const [entryOpen, setEntryOpen] = useState(false),
    [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const transactions = useTransactions(seedTransactions);
  return (
    <AppShell onOpenSettings={() => setSettingsOpen(true)}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>สวัสดี, กิตติ 👋</h1>
            <p>นี่คือภาพรวมการเงินของคุณในเดือนนี้</p>
          </div>
          <button className={styles.primary} onClick={() => setEntryOpen(true)}>
            ＋ เพิ่มรายการ
          </button>
        </header>
        <DashboardSummary totals={transactions.totals} />
        <section className={styles.content}>
          <TransactionPanel
            transactions={transactions.transactions}
            filter={transactions.filter}
            newItemId={transactions.newItemId}
            onFilter={transactions.setFilter}
            onRequestDelete={transactions.setPendingDelete}
          />
          <CategoryChart
            transactions={transactions.transactions}
            expenseTotal={transactions.totals.expense}
          />
        </section>
      </main>
      {entryOpen && (
        <TransactionForm
          onClose={() => setEntryOpen(false)}
          onAdd={transactions.addTransaction}
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
        />
      )}
      {transactions.removed && <UndoToast onUndo={transactions.undoDelete} />}
    </AppShell>
  );
}
