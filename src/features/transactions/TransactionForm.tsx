import { useState } from "react";
import type { FormEvent } from "react";
import type { Transaction, TransactionType } from "./domain";
import { Overlay } from "../../shared/ui/Overlay";
import styles from "./Transactions.module.css";
type Props = { onClose: () => void; onAdd: (item: Transaction) => void };
export function TransactionForm({ onClose, onAdd }: Props) {
  const [type, setType] = useState<TransactionType>("expense"),
    [title, setTitle] = useState(""),
    [amount, setAmount] = useState(""),
    [category, setCategory] = useState("อาหาร");
  const save = (event: FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!title.trim() || value <= 0) return;
    const icons: Record<string, string> = {
      อาหาร: "🍜",
      เดินทาง: "🚆",
      ช้อปปิ้ง: "🛍️",
      บ้าน: "🏠",
      อื่นๆ: "•",
    };
    onAdd({
      id: Date.now(),
      title: title.trim(),
      category: type === "income" ? "รายรับ" : category,
      date: "วันนี้",
      amount: value,
      type,
      icon: type === "income" ? "฿" : icons[category],
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
            onClick={() => setType("expense")}
          >
            รายจ่าย
          </button>
          <button
            type="button"
            className={type === "income" ? `${styles.on} ${styles.incomeOn}` : undefined}
            onClick={() => setType("income")}
          >
            รายรับ
          </button>
        </div>
        <label>
          ชื่อรายการ
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="เช่น ค่าอาหารกลางวัน"
          />
        </label>
        <label>
          จำนวนเงิน (บาท)
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
          />
        </label>
        {type === "expense" && (
          <label>
            หมวดหมู่
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option>อาหาร</option>
              <option>เดินทาง</option>
              <option>ช้อปปิ้ง</option>
              <option>บ้าน</option>
              <option>อื่นๆ</option>
            </select>
          </label>
        )}
        <button className={styles.formSubmit}>บันทึกรายการ</button>
      </form>
    </Overlay>
  );
}
