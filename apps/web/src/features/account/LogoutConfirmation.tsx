import { useEffect, useRef } from "react";
import { Overlay } from "../../shared/ui/Overlay";
import styles from "./LogoutConfirmation.module.css";

type Props = {
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function LogoutConfirmation({
  pending,
  error,
  onCancel,
  onConfirm,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => cancelRef.current?.focus(), []);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel, pending]);

  return (
    <Overlay onDismiss={() => !pending && onCancel()} priority="alert">
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        aria-describedby="logout-description"
        aria-busy={pending}
        onKeyDown={(event) => {
          if (event.key !== "Tab" || pending) return;
          const buttons = event.currentTarget.querySelectorAll("button");
          const first = buttons.item(0);
          const last = buttons.item(buttons.length - 1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <h2 id="logout-title">ออกจากระบบหรือไม่?</h2>
        <p id="logout-description">อุปกรณ์นี้จะต้องเข้าสู่ระบบใหม่</p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button ref={cancelRef} disabled={pending} onClick={onCancel}>
            ยกเลิก
          </button>
          <button
            className={styles.confirm}
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
          </button>
        </div>
      </section>
    </Overlay>
  );
}
