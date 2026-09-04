import type { MouseEvent, ReactNode } from "react";
import styles from "./Overlay.module.css";

type Props = {
  children: ReactNode;
  onDismiss: () => void;
  priority?: "default" | "alert";
};

export function Overlay({ children, onDismiss, priority = "default" }: Props) {
  const stopDismiss = (event: MouseEvent) => event.stopPropagation();
  return (
    <div
      className={`${styles.backdrop} ${priority === "alert" ? styles.alert : ""}`}
      onMouseDown={onDismiss}
    >
      <div className={styles.content} onMouseDown={stopDismiss}>
        {children}
      </div>
    </div>
  );
}
