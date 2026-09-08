import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Overlay } from "../../shared/ui/Overlay";
import styles from "./Savings.module.css";
import { parseBahtToSatang, satangToDecimal } from "../../shared/money-input";
export function SavingsGoalForm({
  currentGoal,
  onSave,
  onClose,
  onlineSave,
}: {
  currentGoal: number | null;
  onSave?: (goal: number) => void;
  onlineSave?: (satang: number) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(
    currentGoal
      ? onlineSave
        ? satangToDecimal(currentGoal)
        : String(currentGoal)
      : "",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (saving.current) return;
    const satang = parseBahtToSatang(value);
    if (satang === null) {
      setError("กรุณาระบุเป้าหมายที่มากกว่า 0 และมีทศนิยมไม่เกิน 2 ตำแหน่ง");
      return;
    }
    const goal = Number(value);
    if (!Number.isFinite(goal) || goal <= 0) return;
    if (onlineSave) {
      saving.current = true;
      setPending(true);
      setError("");
      void onlineSave(satang)
        .then(onClose)
        .catch((error) =>
          setError(
            error instanceof Error
              ? error.message
              : "บันทึกเป้าหมายไม่สำเร็จ กรุณาลองอีกครั้ง",
          ),
        )
        .finally(() => {
          saving.current = false;
          setPending(false);
        });
    } else {
      onSave?.(goal);
      onClose();
    }
  };
  return (
    <Overlay
      onDismiss={() => {
        if (!saving.current) onClose();
      }}
    >
      <form
        className={styles.goalForm}
        aria-label="ตั้งเป้าหมายเงินเก็บ"
        onSubmit={save}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.formHead}>
          <div>
            <h3>
              {currentGoal ? "แก้ไขเป้าหมายเงินเก็บ" : "ตั้งเป้าหมายเงินเก็บ"}
            </h3>
            <p>กำหนดยอดที่คุณอยากเก็บให้ได้</p>
          </div>
          <button
            type="button"
            aria-label="ปิด"
            onClick={onClose}
            disabled={pending}
          >
            ×
          </button>
        </div>
        <label>
          เป้าหมาย (บาท)
          <input
            autoFocus
            type="number"
            min="0.01"
            step="0.01"
            disabled={pending}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="20,000"
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button className={styles.saveGoal} disabled={pending}>
          {pending ? "กำลังบันทึก…" : "บันทึกเป้าหมาย"}
        </button>
      </form>
    </Overlay>
  );
}
