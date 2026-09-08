import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Transaction, TransactionType } from "./domain";
import { Overlay } from "../../shared/ui/Overlay";
import styles from "./Transactions.module.css";
import { parseBahtToSatang, formatMoney } from "../../shared/money-input";

type Props = {
  onClose: () => void;
  onAdd: (item: Transaction) => boolean | Promise<boolean>;
  availableBalance: number;
  walletToday?: string;
};
const savingCategories = [
  "เงินฉุกเฉิน",
  "ท่องเที่ยว",
  "ซื้อของชิ้นใหญ่",
  "เกษียณ",
  "อื่น ๆ",
];
const expenseCategories = ["อาหาร", "เดินทาง", "ช้อปปิ้ง", "บ้าน", "อื่นๆ"];

export function TransactionForm({
  onClose,
  onAdd,
  availableBalance,
  walletToday,
}: Props) {
  const [occurredOn, setOccurredOn] = useState(walletToday ?? "");
  const [occurredTime, setOccurredTime] = useState("");
  const [pending, setPending] = useState(false);
  const saving = useRef(false);
  const [type, setType] = useState<TransactionType>("expense"),
    [title, setTitle] = useState(""),
    [amount, setAmount] = useState(""),
    [category, setCategory] = useState("อาหาร"),
    [customCategory, setCustomCategory] = useState(""),
    [error, setError] = useState("");
  const chooseType = (next: TransactionType) => {
    setType(next);
    setCategory(next === "saving" ? "เงินฉุกเฉิน" : "อาหาร");
    setError("");
  };
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (saving.current) return;
    const amountSatang = parseBahtToSatang(amount);
    if (amountSatang === null) {
      setError("กรุณาระบุจำนวนเงินที่มากกว่า 0 และมีทศนิยมไม่เกิน 2 ตำแหน่ง");
      return;
    }
    const value = walletToday ? amountSatang : Number(amount);
    if (!title.trim() || value <= 0) return;
    if ((type === "expense" || type === "saving") && value > availableBalance) {
      setError(
        `ยอด${type === "expense" ? "รายจ่าย" : "เงินเก็บ"}มากกว่าเงินพร้อมใช้ ${formatMoney(value - availableBalance, walletToday ? "satang" : "baht")} บาท`,
      );
      return;
    }
    if (type === "saving" && category === "อื่น ๆ" && !customCategory.trim()) {
      setError("กรุณาระบุประเภทเงินเก็บ");
      return;
    }
    const icons: Record<string, string> = {
      อาหาร: "🍜",
      เดินทาง: "🚆",
      ช้อปปิ้ง: "🛍️",
      บ้าน: "🏠",
      อื่นๆ: "•",
    };
    const createdAt = new Date().toISOString();
    const item: Transaction = {
      id: Date.now(),
      title: title.trim(),
      category:
        type === "income"
          ? "รายรับ"
          : type === "saving" && category === "อื่น ๆ"
            ? customCategory.trim()
            : category,
      date: "วันนี้",
      createdAt,
      amount: value,
      type,
      icon: type === "income" ? "฿" : type === "saving" ? "◇" : icons[category],
      ...(walletToday
        ? { occurredOn, occurredTime: occurredTime || null, amountSatang }
        : {}),
    };
    const finish = (saved: boolean) => {
      saving.current = false;
      setPending(false);
      if (saved) onClose();
      else
        setError(
          walletToday
            ? "บันทึกรายการไม่สำเร็จ กรุณาลองอีกครั้ง"
            : "บันทึกรายการไม่สำเร็จ กรุณาลองอีกครั้ง หรือตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์",
        );
    };
    saving.current = true;
    setPending(true);
    try {
      const result = onAdd(item);
      if (typeof result === "boolean") finish(result);
      else
        void result.then(finish).catch((error) => {
          finish(false);
          if (error instanceof Error) setError(error.message);
        });
    } catch {
      finish(false);
    }
  };
  return (
    <Overlay
      onDismiss={() => {
        if (!saving.current) onClose();
      }}
    >
      <form
        className={styles.form}
        aria-label="เพิ่มรายการใหม่"
        onSubmit={save}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.formHead}>
          <h3>เพิ่มรายการใหม่</h3>
          <button
            type="button"
            aria-label="ปิด"
            onClick={onClose}
            disabled={pending}
          >
            ×
          </button>
        </div>
        <fieldset disabled={pending} className={styles.fields}>
          <div className={styles.switch}>
            <button
              type="button"
              className={type === "expense" ? styles.on : undefined}
              onClick={() => chooseType("expense")}
            >
              รายจ่าย
            </button>
            <button
              type="button"
              className={
                type === "income"
                  ? `${styles.on} ${styles.incomeOn}`
                  : undefined
              }
              onClick={() => chooseType("income")}
            >
              รายรับ
            </button>
            <button
              type="button"
              className={
                type === "saving"
                  ? `${styles.on} ${styles.savingOn}`
                  : undefined
              }
              onClick={() => chooseType("saving")}
            >
              เงินเก็บ
            </button>
          </div>
          <label>
            ชื่อรายการ
            <input
              autoFocus
              required
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={
                type === "saving"
                  ? "เช่น เก็บเงินเดือนนี้"
                  : "เช่น ค่าอาหารกลางวัน"
              }
            />
          </label>
          <label>
            จำนวนเงิน (บาท)
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError("");
              }}
              placeholder="0.00"
            />
          </label>
          {(type === "expense" || type === "saving") && (
            <label>
              {type === "saving" ? "ประเภทเงินเก็บ" : "หมวดหมู่"}
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {(type === "saving" ? savingCategories : expenseCategories).map(
                  (option) => (
                    <option key={option}>{option}</option>
                  ),
                )}
              </select>
            </label>
          )}
          {walletToday && (
            <>
              <label>
                วันที่เกิดรายการ
                <input
                  type="date"
                  required
                  min="1900-01-01"
                  value={occurredOn}
                  onChange={(event) => setOccurredOn(event.target.value)}
                />
              </label>
              <label>
                เวลาเกิดรายการ (ไม่บังคับ)
                <input
                  type="time"
                  value={occurredTime}
                  onChange={(event) => setOccurredTime(event.target.value)}
                />
              </label>
            </>
          )}
          {type === "saving" && category === "อื่น ๆ" && (
            <label>
              ชื่อประเภทเงินเก็บ
              <input
                value={customCategory}
                maxLength={80}
                onChange={(event) => setCustomCategory(event.target.value)}
              />
            </label>
          )}
          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}
          <button className={styles.formSubmit}>
            {pending ? "กำลังบันทึก…" : "บันทึกรายการ"}
          </button>
        </fieldset>
      </form>
    </Overlay>
  );
}
