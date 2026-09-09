import idle from "../../assets/mascot-idle-seated.png";
import idleBlink from "../../assets/mascot-idle-seated-blink.png";
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
      className={styles["dashboard-mascot"]}
      data-state={state}
      data-testid="dashboard-mascot"
    >
      <div className={styles["dashboard-mascot-character"]} aria-hidden="true">
        {Object.entries(images).map(([name, src]) => (
          <img
            key={name}
            className={
              name === "idle"
                ? styles["dashboard-mascot-idle-primary-frame"]
                : undefined
            }
            src={src}
            alt=""
            width="720"
            height="720"
            hidden={state !== name}
          />
        ))}
        <img
          className={styles["dashboard-mascot-idle-blink-frame"]}
          src={idleBlink}
          alt=""
          width="1254"
          height="1254"
          hidden={state !== "idle"}
        />
      </div>
      <p
        className={styles["dashboard-mascot-feedback"]}
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
