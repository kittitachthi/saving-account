import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Transaction, TransactionType } from "./domain";
import { Overlay } from "../../shared/ui/Overlay";
import styles from "./TransactionForm.module.css";
import {
  parseBahtToSatang,
  formatMoney,
  satangToDecimal,
} from "../../shared/money-input";

type Props = {
  onTransactionFormClose: () => void;
  onTransactionSubmit: (item: Transaction) => boolean | Promise<boolean>;
  availableBalance: number;
  walletToday?: string;
  initialTransaction?: Transaction;
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
  onTransactionFormClose,
  onTransactionSubmit,
  availableBalance,
  walletToday,
  initialTransaction,
}: Props) {
  const [occurredOn, setOccurredOn] = useState(
    initialTransaction?.occurredOn ?? walletToday ?? "",
  );
  const [occurredTime, setOccurredTime] = useState(
    initialTransaction?.occurredTime ?? "",
  );
  const [pending, setPending] = useState(false);
  const saving = useRef(false);
  const [type, setType] = useState<TransactionType>(
      initialTransaction?.type ?? "expense",
    ),
    [title, setTitle] = useState(initialTransaction?.title ?? ""),
    [amount, setAmount] = useState(
      initialTransaction ? satangToDecimal(initialTransaction.amount) : "",
    ),
    [category, setCategory] = useState(initialTransaction?.category ?? "อาหาร"),
    [customCategory, setCustomCategory] = useState(""),
    [error, setError] = useState("");
  const transactionTypeSelect = (nextTransactionType: TransactionType) => {
    setType(nextTransactionType);
    setCategory(nextTransactionType === "saving" ? "เงินฉุกเฉิน" : "อาหาร");
    setError("");
  };
  const transactionFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (saving.current) return;
    const amountSatang = parseBahtToSatang(amount);
    if (amountSatang === null) {
      setError("กรุณาระบุจำนวนเงินที่มากกว่า 0 และมีทศนิยมไม่เกิน 2 ตำแหน่ง");
      return;
    }
    const value = walletToday ? amountSatang : Number(amount);
    if (!title.trim() || value <= 0) return;
    if (
      !initialTransaction &&
      (type === "expense" || type === "saving") &&
      value > availableBalance
    ) {
      setError(
        `ยอด${type === "expense" ? "รายจ่าย" : "เงินเก็บ"}มากกว่าเงินพร้อมใช้ ${formatMoney(value - availableBalance, walletToday ? "satang" : "baht")} บาท`,
      );
      return;
    }
    if (
      !initialTransaction &&
      type === "saving" &&
      category === "อื่น ๆ" &&
      !customCategory.trim()
    ) {
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
    const transactionDraft: Transaction = {
      id: Date.now(),
      title: title.trim(),
      category: initialTransaction
        ? category.trim()
        : type === "income"
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
    const transactionSubmitComplete = (transactionSaved: boolean) => {
      saving.current = false;
      setPending(false);
      if (transactionSaved) onTransactionFormClose();
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
      const transactionSubmitResult = onTransactionSubmit(transactionDraft);
      if (typeof transactionSubmitResult === "boolean")
        transactionSubmitComplete(transactionSubmitResult);
      else
        void transactionSubmitResult
          .then(transactionSubmitComplete)
          .catch((error) => {
            transactionSubmitComplete(false);
            if (error instanceof Error) setError(error.message);
          });
    } catch {
      transactionSubmitComplete(false);
    }
  };
  return (
    <Overlay
      onDismiss={() => {
        if (!saving.current) onTransactionFormClose();
      }}
    >
      <form
        className={styles["transaction-form-dialog"]}
        aria-label={initialTransaction ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
        onSubmit={transactionFormSubmit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles["transaction-form-header"]}>
          <h3>{initialTransaction ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}</h3>
          <button
            type="button"
            className={styles["transaction-form-close-button"]}
            aria-label="ปิด"
            onClick={onTransactionFormClose}
            disabled={pending}
          >
            ×
          </button>
        </div>
        <fieldset
          disabled={pending}
          className={styles["transaction-form-fieldset"]}
        >
          <div className={styles["transaction-type-selector"]}>
            <button
              type="button"
              disabled={!!initialTransaction}
              className={`${styles["transaction-type-button"]} ${type === "expense" ? styles["transaction-type-selected"] : ""}`}
              onClick={() => transactionTypeSelect("expense")}
            >
              รายจ่าย
            </button>
            <button
              type="button"
              disabled={!!initialTransaction}
              className={
                type === "income"
                  ? `${styles["transaction-type-button"]} ${styles["transaction-type-selected"]} ${styles["transaction-income-selected"]}`
                  : styles["transaction-type-button"]
              }
              onClick={() => transactionTypeSelect("income")}
            >
              รายรับ
            </button>
            <button
              type="button"
              disabled={!!initialTransaction}
              className={
                type === "saving"
                  ? `${styles["transaction-type-button"]} ${styles["transaction-type-selected"]} ${styles["transaction-saving-selected"]}`
                  : styles["transaction-type-button"]
              }
              onClick={() => transactionTypeSelect("saving")}
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
          {initialTransaction && (
            <label>
              หมวดหมู่
              <input
                required
                maxLength={80}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />
            </label>
          )}
          {!initialTransaction && (type === "expense" || type === "saving") && (
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
          {!initialTransaction &&
            type === "saving" &&
            category === "อื่น ๆ" && (
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
            <p
              className={styles["transaction-form-error-message"]}
              role="alert"
            >
              {error}
            </p>
          )}
          <button className={styles["transaction-save-button"]}>
            {pending ? "กำลังบันทึก…" : "บันทึกรายการ"}
          </button>
        </fieldset>
      </form>
    </Overlay>
  );
}
