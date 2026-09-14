import { useState } from "react";
import { Overlay } from "../../shared/ui/Overlay";
import { Button } from "../../shared/ui/Button";
import { authenticatedRequest } from "../auth";
import styles from "./AccountDeletionConfirmation.module.css";

export function AccountDeletionConfirmation({
  onAccountDeletionCancel,
  onAccountDeletionComplete,
}: {
  onAccountDeletionCancel: () => void;
  onAccountDeletionComplete: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const handleAccountDeletionConfirm = async () => {
    setPending(true);
    setError("");
    try {
      await authenticatedRequest("/api/auth/account/deletion", {
        method: "POST",
      });
      onAccountDeletionComplete();
    } catch {
      setError("ขอลบบัญชีไม่สำเร็จ กรุณาลองอีกครั้ง");
      setPending(false);
    }
  };
  return (
    <Overlay
      priority="alert"
      onDismiss={pending ? () => {} : onAccountDeletionCancel}
    >
      <section
        className={styles["account-deletion-dialog"]}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-deletion-title"
      >
        <h2 id="account-deletion-title">ยืนยันขอลบบัญชี</h2>
        <p>
          บัญชีจะหยุดใช้งานทันที คุณกู้คืน Account และ Personal Wallet ผ่าน
          Google Account เดิมได้ภายใน 30 วัน แต่การแชร์และคำเชิญเดิมจะไม่กลับคืน
        </p>
        {error && <p role="alert">{error}</p>}
        <div>
          <Button disabled={pending} onClick={onAccountDeletionCancel}>
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            pending={pending}
            onClick={() => void handleAccountDeletionConfirm()}
          >
            {pending ? "กำลังดำเนินการ…" : "ขอลบบัญชี"}
          </Button>
        </div>
      </section>
    </Overlay>
  );
}
