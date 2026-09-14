import { useState } from "react";
import { Overlay } from "../../shared/ui/Overlay";
import { Button } from "../../shared/ui/Button";
import { authenticatedRequest } from "../auth";
import { deviceImportComplete, type DeviceImportPreview } from "./deviceImport";
import styles from "./DeviceImportDialog.module.css";

export function DeviceImportDialog({
  walletId,
  preview,
  onDeviceImportCancel,
  onDeviceImportComplete,
}: {
  walletId: string;
  preview: DeviceImportPreview;
  onDeviceImportCancel: () => void;
  onDeviceImportComplete: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const deviceDataImport = async () => {
    setPending(true);
    setError("");
    try {
      const ordered = [...preview.items].sort(
        (a, b) => Number(b.type === "income") - Number(a.type === "income"),
      );
      for (const { sourceIndex: _sourceIndex, ...item } of ordered)
        await authenticatedRequest(`/api/wallets/${walletId}/transactions`, {
          method: "POST",
          body: JSON.stringify(item),
        });
      if (preview.savingsGoal)
        await authenticatedRequest(`/api/wallets/${walletId}/savings-goal`, {
          method: "PUT",
          body: JSON.stringify({ amount: preview.savingsGoal }),
        });
      deviceImportComplete();
      onDeviceImportComplete();
    } catch {
      setError("นำเข้าบางรายการไม่สำเร็จ ข้อมูลต้นฉบับยังอยู่และลองใหม่ได้");
      setPending(false);
    }
  };
  return (
    <Overlay onDismiss={pending ? () => {} : onDeviceImportCancel}>
      <section
        className={styles["device-import-dialog"]}
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-import-title"
      >
        <h2 id="device-import-title">นำเข้าข้อมูลเดิมจากอุปกรณ์</h2>
        <p>
          พบรายการที่พร้อมนำเข้า {preview.items.length} รายการ
          {preview.savingsGoal ? " และเป้าหมายเงินเก็บ" : ""}
        </p>
        {preview.invalidIndexes.length > 0 && (
          <p role="status">
            ข้ามข้อมูลที่ไม่ถูกต้องลำดับที่{" "}
            {preview.invalidIndexes.map((index) => index + 1).join(", ")}
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        <div>
          <Button disabled={pending} onClick={onDeviceImportCancel}>
            เริ่มใหม่โดยยังเก็บข้อมูลเดิม
          </Button>
          <Button
            variant="primary"
            pending={pending}
            onClick={() => void deviceDataImport()}
          >
            {pending ? "กำลังนำเข้า…" : "ยืนยันนำเข้า"}
          </Button>
        </div>
      </section>
    </Overlay>
  );
}
