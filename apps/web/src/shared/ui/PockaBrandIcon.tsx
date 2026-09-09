import styles from "./PockaBrandIcon.module.css";

export type PockaBrandIconSize = "compact" | "dialog";

export function PockaBrandIcon({
  size = "compact",
}: {
  size?: PockaBrandIconSize;
}) {
  return (
    <svg
      className={`${styles["pocka-brand-icon"]} ${styles[`pocka-brand-${size}-icon`]}`}
      data-pocka-brand-mark="true"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className={styles["pocka-brand-clasp-frame"]}
        d="M16 19c0-6.1 4.9-11 11-11h10c6.1 0 11 4.9 11 11v4H16v-4Z"
      />
      <circle
        className={styles["pocka-brand-clasp-knob"]}
        cx="25"
        cy="9"
        r="5"
      />
      <circle
        className={styles["pocka-brand-clasp-knob"]}
        cx="39"
        cy="9"
        r="5"
      />
      <path
        className={styles["pocka-brand-purse-body"]}
        d="M9 29c0-7.2 5.8-13 13-13h20c7.2 0 13 5.8 13 13v15c0 8.8-7.2 16-16 16H25C16.2 60 9 52.8 9 44V29Z"
      />
      <path className={styles["pocka-brand-purse-rim"]} d="M13 24h38" />
      <circle
        className={styles["pocka-brand-face-eye"]}
        cx="24"
        cy="37"
        r="3"
      />
      <circle
        className={styles["pocka-brand-face-eye"]}
        cx="40"
        cy="37"
        r="3"
      />
      <path
        className={styles["pocka-brand-face-smile"]}
        d="M24 46c2.2 2.4 4.9 3.5 8 3.5s5.8-1.1 8-3.5"
      />
    </svg>
  );
}
