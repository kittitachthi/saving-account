import type { ReactNode } from "react";
import styles from "../App.module.css";

export function FinancialOverview({
  displayName,
  hasGoal,
  onSavingsGoalEditRequest,
  onTransactionCreateRequest,
  disabled,
  notice,
  summary,
  children,
}: {
  displayName: string;
  hasGoal: boolean;
  onSavingsGoalEditRequest: () => void;
  onTransactionCreateRequest: () => void;
  disabled?: boolean;
  notice?: ReactNode;
  summary: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1>สวัสดี, {displayName} 👋</h1>
          <p>นี่คือภาพรวมการเงินของคุณในเดือนนี้</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.secondary}
            disabled={disabled}
            onClick={onSavingsGoalEditRequest}
          >
            ◎ {hasGoal ? "แก้ไขเป้าหมาย" : "ตั้งเป้าหมายเงินเก็บ"}
          </button>
          <button
            className={styles.primary}
            disabled={disabled}
            onClick={onTransactionCreateRequest}
          >
            ＋ เพิ่มรายการ
          </button>
        </div>
      </header>
      {notice}
      {summary}
      <section className={styles.content}>{children}</section>
    </main>
  );
}
