import type { ReactNode } from "react";
import styles from "./AppShell.module.css";
type Props = {
  children: ReactNode;
  displayName: string;
  onOpenSettings: () => void;
};
export function AppShell({ children, displayName, onOpenSettings }: Props) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <b>฿</b>
          <strong>บันทึกเงิน</strong>
        </div>
        <nav className={styles.nav}>
          <button className={`${styles.navButton} ${styles.active}`}>
            ⌂ <span>ภาพรวม</span>
          </button>
          <button className={styles.navButton}>
            ↕ <span>รายการทั้งหมด</span>
          </button>
          <button className={styles.navButton}>
            ◎ <span>งบประมาณ</span>
          </button>
          <button className={styles.navButton}>
            ▥ <span>รายงาน</span>
          </button>
        </nav>
        <div className={styles.asideBottom}>
          <button className={styles.settingsButton} onClick={onOpenSettings}>
            ⚙ <span>ตั้งค่า</span>
          </button>
          <div className={styles.profile}>
            <i>{displayName.trim().charAt(0).toLocaleUpperCase() || "?"}</i>
            <div>
              <b>{displayName}</b>
              <small>บัญชีส่วนตัว</small>
            </div>
          </div>
        </div>
      </aside>
      <button
        className={styles.mobileSettings}
        aria-label="เปิดการตั้งค่า"
        onClick={onOpenSettings}
      >
        ⚙<span>ตั้งค่า</span>
      </button>
      {children}
    </div>
  );
}
