import { useEffect, useState } from "react";
import type { AuthSessionResponse } from "@saving-account/contracts";
import App from "../App";
import { useTheme } from "../features/theme";
import { MarketingPage } from "../features/marketing/MarketingPage";
import styles from "./Application.module.css";

type SessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; session: AuthSessionResponse };

export function Application() {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  const { theme, toggleTheme } = useTheme();

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
      <MarketingPage
        notice={null}
        returnTo={returnTo}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
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
        setState({ status: "anonymous" });
      }}
    />
  );
}
