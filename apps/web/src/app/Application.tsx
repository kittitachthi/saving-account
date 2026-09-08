import App from "../App";
import { useTheme } from "../features/theme";
import { useSession } from "../features/auth";
import { MarketingPage } from "../features/marketing/MarketingPage";
import styles from "./Application.module.css";

export function Application() {
  const { state, logout } = useSession();
  const { theme, toggleTheme } = useTheme();

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
        notice={state.notice}
        returnTo={returnTo}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return <App user={state.session.user} onLogout={logout} />;
}
