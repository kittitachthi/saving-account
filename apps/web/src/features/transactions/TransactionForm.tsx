import { useState } from "react";
import type { FormEvent } from "react";
import type { Transaction, TransactionType } from "./domain";
import { Overlay } from "../../shared/ui/Overlay";
import styles from "./Transactions.module.css";

type Props = {
  onClose: () => void;
  onAdd: (item: Transaction) => void;
  availableBalance: number;
};
const savingCategories = [
  "เงินฉุกเฉิน",
  "ท่องเที่ยว",
  "ซื้อของชิ้นใหญ่",
  "เกษียณ",
  "อื่น ๆ",
];
const expenseCategories = ["อาหาร", "เดินทาง", "ช้อปปิ้ง", "บ้าน", "อื่นๆ"];
const money = (value: number) => new Intl.NumberFormat("th-TH").format(value);

export function TransactionForm({ onClose, onAdd, availableBalance }: Props) {
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
    const value = Number(amount);
    if (!title.trim() || value <= 0) return;
    if ((type === "expense" || type === "saving") && value > availableBalance) {
      setError(
        `ยอด${type === "expense" ? "รายจ่าย" : "เงินเก็บ"}มากกว่าเงินพร้อมใช้ ${money(value - availableBalance)} บาท`,
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
    onAdd({
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
    });
    onClose();
  };
  return (
    <Overlay onDismiss={onClose}>
      <form
        className={styles.form}
        aria-label="เพิ่มรายการใหม่"
        onSubmit={save}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.formHead}>
          <h3>เพิ่มรายการใหม่</h3>
          <button type="button" aria-label="ปิด" onClick={onClose}>
            ×
          </button>
        </div>
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
              type === "income" ? `${styles.on} ${styles.incomeOn}` : undefined
            }
            onClick={() => chooseType("income")}
          >
            รายรับ
          </button>
          <button
            type="button"
            className={
              type === "saving" ? `${styles.on} ${styles.savingOn}` : undefined
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
            min="1"
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
        {type === "saving" && category === "อื่น ๆ" && (
          <label>
            ชื่อประเภทเงินเก็บ
            <input
              value={customCategory}
              onChange={(event) => setCustomCategory(event.target.value)}
            />
          </label>
        )}
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
        <button className={styles.formSubmit}>บันทึกรายการ</button>
      </form>
    </Overlay>
  );
}
