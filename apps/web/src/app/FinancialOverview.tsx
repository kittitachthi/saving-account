import type { ReactNode } from "react";
import styles from "./FinancialOverview.module.css";

export function FinancialOverview({
  displayName,
  hasGoal,
  onSavingsGoalEditRequest,
  onTransactionCreateRequest,
  onWalletSharingOpenRequest,
  walletSharingLabel,
  disabled,
  notice,
  summary,
  children,
}: {
  displayName: string;
  hasGoal: boolean;
  onSavingsGoalEditRequest?: () => void;
  onTransactionCreateRequest?: () => void;
  onWalletSharingOpenRequest?: () => void;
  walletSharingLabel?: string;
  disabled?: boolean;
  notice?: ReactNode;
  summary: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className={styles["financial-overview-main"]}>
      <header className={styles["financial-overview-header"]}>
        <div>
          <h1 className={styles["financial-overview-title"]}>
            สวัสดี, {displayName} 👋
          </h1>
          <p className={styles["financial-overview-description"]}>
            นี่คือภาพรวมการเงินของคุณในเดือนนี้
          </p>
        </div>
        {(onWalletSharingOpenRequest ||
          onSavingsGoalEditRequest ||
          onTransactionCreateRequest) && (
          <div className={styles["financial-overview-header-actions"]}>
            {onWalletSharingOpenRequest && (
              <button
                className={styles["financial-overview-secondary-button"]}
                onClick={onWalletSharingOpenRequest}
              >
                ⇄ {walletSharingLabel}
              </button>
            )}
            {onSavingsGoalEditRequest && (
              <button
                className={styles["financial-overview-secondary-button"]}
                disabled={disabled}
                onClick={onSavingsGoalEditRequest}
              >
                ◎ {hasGoal ? "แก้ไขเป้าหมาย" : "ตั้งเป้าหมายเงินเก็บ"}
              </button>
            )}
            {onTransactionCreateRequest && (
              <button
                className={styles["financial-overview-primary-button"]}
                disabled={disabled}
                onClick={onTransactionCreateRequest}
              >
                ＋ เพิ่มรายการ
              </button>
            )}
          </div>
        )}
      </header>
      {notice}
      {summary}
      <section className={styles["financial-overview-content"]}>
        {children}
      </section>
    </main>
  );
}
