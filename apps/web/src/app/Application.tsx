import { useEffect, useState } from "react";
import type { AuthSessionResponse } from "@saving-account/contracts";
import App from "../App";
import styles from "./Application.module.css";

type SessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; session: AuthSessionResponse };

export function Application() {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/auth/session", {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          setState({ status: "anonymous" });
          return;
        }
        setState({
          status: "authenticated",
          session: (await response.json()) as AuthSessionResponse,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setState({ status: "anonymous" });
      });
    return () => controller.abort();
  }, []);

  if (state.status === "loading") {
    return (
      <main className={styles.centered} aria-live="polite">
        กำลังตรวจสอบการเข้าสู่ระบบ…
      </main>
    );
  }

  if (state.status === "anonymous") {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    return (
      <main className={styles.centered}>
        <section className={styles.signIn} aria-labelledby="sign-in-title">
          <h1 className={styles.title} id="sign-in-title">
            Saving Account
          </h1>
          <p className={styles.copy}>เข้าสู่ระบบเพื่อเปิดข้อมูลการเงินของคุณ</p>
          {notice && <p role="status">{notice}</p>}
          <a
            className={styles.googleButton}
            href={`/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`}
          >
            เข้าสู่ระบบด้วย Google
          </a>
        </section>
      </main>
    );
  }

  return (
    <App
      user={state.session.user}
      onLogout={async () => {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Logout failed");
        setNotice("ออกจากระบบแล้ว");
        setState({ status: "anonymous" });
      }}
    />
  );
}
