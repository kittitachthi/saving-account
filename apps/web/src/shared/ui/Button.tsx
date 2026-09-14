import type { ButtonHTMLAttributes, Ref } from "react";
import styles from "./Button.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "destructive";
  pending?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

export function Button({
  variant = "secondary",
  pending = false,
  disabled,
  className,
  ref,
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      ref={ref}
      className={`${styles["shared-action-button"]} ${styles[`shared-${variant}-button`]} ${className ?? ""}`}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
    >
      {children}
    </button>
  );
}
