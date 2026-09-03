import { useState } from "react";
import type { FormEvent } from "react";
import { Overlay } from "../../shared/ui/Overlay";
import styles from "./Savings.module.css";
export function SavingsGoalForm({ currentGoal, onSave, onClose }: { currentGoal: number | null; onSave: (goal: number) => void; onClose: () => void }) {
  const [value, setValue] = useState(currentGoal ? String(currentGoal) : "");
  const save = (event: FormEvent) => { event.preventDefault(); const goal = Number(value); if (!Number.isFinite(goal) || goal <= 0) return; onSave(goal); onClose(); };
  return <Overlay onDismiss={onClose}><form className={styles.goalForm} aria-label="ตั้งเป้าหมายเงินเก็บ" onSubmit={save} onMouseDown={(event) => event.stopPropagation()}>
    <div className={styles.formHead}><div><h3>{currentGoal ? "แก้ไขเป้าหมายเงินเก็บ" : "ตั้งเป้าหมายเงินเก็บ"}</h3><p>กำหนดยอดที่คุณอยากเก็บให้ได้</p></div><button type="button" aria-label="ปิด" onClick={onClose}>×</button></div>
    <label>เป้าหมาย (บาท)<input autoFocus type="number" min="1" value={value} onChange={(event) => setValue(event.target.value)} placeholder="20,000" /></label>
    <button className={styles.saveGoal}>บันทึกเป้าหมาย</button>
  </form></Overlay>;
}
