import { useEffect, type ReactNode } from "react";
import styles from "./SettingsSurface.module.css";
import type { Theme } from "../theme/useTheme";
type Props = {
  theme: Theme;
  onThemeToggleRequest: () => void;
  onSettingsCloseRequest: () => void;
  accountSettings?: ReactNode;
};
export function SettingsSurface({
  theme,
  onThemeToggleRequest,
  onSettingsCloseRequest,
  accountSettings,
}: Props) {
  useEffect(() => {
    const handleSettingsDismissKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onSettingsCloseRequest();
    };
    window.addEventListener("keydown", handleSettingsDismissKey);
    return () =>
      window.removeEventListener("keydown", handleSettingsDismissKey);
  }, [onSettingsCloseRequest]);
  return (
    <div
      className={styles["settings-surface-backdrop"]}
      onMouseDown={onSettingsCloseRequest}
    >
      <section
        className={styles["settings-surface-container"]}
        aria-label="การตั้งค่า"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles["settings-heading-container"]}>
          <div>
            <h3>การตั้งค่า</h3>
            <p>ปรับแต่งหน้าตาของแอป</p>
          </div>
          <button aria-label="ปิดการตั้งค่า" onClick={onSettingsCloseRequest}>
            ×
          </button>
        </div>
        <div className={styles["settings-theme-setting"]}>
          <div>
            <b>ธีมสี</b>
            <small>
              {theme === "light" ? "กำลังใช้ธีมสว่าง" : "กำลังใช้ธีมมืด"}
            </small>
          </div>
          <button
            className={styles["settings-theme-toggle"]}
            onClick={onThemeToggleRequest}
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
        {accountSettings}
      </section>
    </div>
  );
}
