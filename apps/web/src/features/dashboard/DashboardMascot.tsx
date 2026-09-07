import idle from "../../assets/mascot-idle.png";
import income from "../../assets/pocka-mascot.png";
import expense from "../../assets/mascot-expense.png";
import saving from "../../assets/mascot-saving.png";
import sleeping from "../../assets/mascot-sleeping.png";
import error from "../../assets/mascot-error.png";
import type { MascotState } from "./useDashboardMascot";
import styles from "./DashboardMascot.module.css";

const messages: Record<MascotState, string> = {
  idle: "",
  sleeping: "",
  income: "เงินเข้าแล้ว เยี่ยมเลย!",
  expense: "รับรู้แล้ว เดี๋ยวเราช่วยดูให้นะ",
  saving: "เข้าใกล้เป้าหมายอีกนิด!",
  error: "ยังบันทึกไม่ได้ ลองอีกครั้งนะ",
};
const images: Record<MascotState, string> = {
  idle,
  income,
  expense,
  saving,
  sleeping,
  error,
};

export function DashboardMascot({ state }: { state: MascotState }) {
  return (
    <div
      className={styles.mascot}
      data-state={state}
      data-testid="dashboard-mascot"
    >
      <div className={styles.character} aria-hidden="true">
        {Object.entries(images).map(([name, src]) => (
          <img
            key={name}
            src={src}
            alt=""
            width="720"
            height="720"
            hidden={state !== name}
          />
        ))}
      </div>
      <p
        className={styles.feedback}
        role="status"
        aria-label="ข้อความจาก Pocka"
        aria-live="polite"
        aria-atomic="true"
      >
        {messages[state]}
      </p>
    </div>
  );
}
