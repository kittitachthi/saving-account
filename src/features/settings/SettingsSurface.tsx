import { useEffect } from "react";
import styles from "./SettingsSurface.module.css";
import type { Theme } from "../theme/useTheme";
type Props = { theme: Theme; onToggleTheme: () => void; onClose: () => void };
export function SettingsSurface({ theme, onToggleTheme, onClose }: Props) {
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [onClose]);
  return (
    <div
      className={styles.backdrop}
      onMouseDown={onClose}
    >
      <section
        className={styles.surface}
        aria-label="การตั้งค่า"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.head}>
          <div>
            <h3>การตั้งค่า</h3>
            <p>ปรับแต่งหน้าตาของแอป</p>
          </div>
          <button aria-label="ปิดการตั้งค่า" onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.themeSetting}>
          <div>
            <b>ธีมสี</b>
            <small>
              {theme === "light" ? "กำลังใช้ธีมสว่าง" : "กำลังใช้ธีมมืด"}
            </small>
          </div>
          <button
            className={styles.themeToggle}
            onClick={onToggleTheme}
            aria-label={
              theme === "light" ? "เปลี่ยนเป็นธีมมืด" : "เปลี่ยนเป็นธีมสว่าง"
            }
            title={
              theme === "light" ? "เปลี่ยนเป็นธีมมืด" : "เปลี่ยนเป็นธีมสว่าง"
            }
          >
            {theme === "light" ? "☾" : "☀"}
          </button>
        </div>
      </section>
    </div>
  );
}
