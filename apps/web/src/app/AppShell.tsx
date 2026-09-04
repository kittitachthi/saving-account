import { useEffect, useRef, useState, type ReactNode } from "react";
import { ProfileAvatar } from "../features/account";
import styles from "./AppShell.module.css";
type Props = {
  children: ReactNode;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  onOpenSettings: () => void;
  onRequestLogout: (restoreFocus: () => void) => void;
};
export function AppShell({
  children,
  displayName,
  email,
  avatarUrl,
  onOpenSettings,
  onRequestLogout,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const desktopTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const activeTriggerRef = useRef<HTMLButtonElement | null>(null);

  const closeMenu = () => {
    setMenuOpen(false);
    queueMicrotask(() => activeTriggerRef.current?.focus());
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !desktopTriggerRef.current?.contains(target) &&
        !mobileTriggerRef.current?.contains(target)
      ) {
        closeMenu();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const toggleMenu = (trigger: HTMLButtonElement) => {
    activeTriggerRef.current = trigger;
    setMenuOpen((open) => !open);
  };

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
          <button
            ref={desktopTriggerRef}
            className={styles.profile}
            aria-label={`เปิดเมนูบัญชีของ ${displayName}`}
            aria-expanded={menuOpen}
            onClick={(event) => toggleMenu(event.currentTarget)}
          >
            <ProfileAvatar displayName={displayName} avatarUrl={avatarUrl} />
            <div>
              <b>{displayName}</b>
              <small>บัญชีส่วนตัว</small>
            </div>
          </button>
        </div>
      </aside>
      <button
        className={styles.mobileSettings}
        aria-label="เปิดการตั้งค่า"
        onClick={onOpenSettings}
      >
        ⚙<span>ตั้งค่า</span>
      </button>
      <button
        ref={mobileTriggerRef}
        className={styles.mobileAccount}
        aria-label={`เปิดเมนูบัญชีของ ${displayName}`}
        aria-expanded={menuOpen}
        onClick={(event) => toggleMenu(event.currentTarget)}
      >
        <ProfileAvatar displayName={displayName} avatarUrl={avatarUrl} />
      </button>
      {menuOpen && (
        <div
          ref={menuRef}
          className={styles.accountMenu}
          role="region"
          aria-label="เมนูบัญชี"
        >
          <div className={styles.accountIdentity}>
            <ProfileAvatar displayName={displayName} avatarUrl={avatarUrl} />
            <div>
              <b>{displayName}</b>
              <span>{email}</span>
              <small>บัญชีส่วนตัว</small>
            </div>
          </div>
          <button
            onClick={() => {
              setMenuOpen(false);
              onRequestLogout(() => activeTriggerRef.current?.focus());
            }}
          >
            ออกจากระบบ
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
