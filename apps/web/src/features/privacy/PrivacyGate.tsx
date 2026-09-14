import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { PrivacyNoticeResponse } from "@saving-account/contracts";
import { authenticatedRequest, ApiError } from "../auth";
import { AccountDeletionConfirmation, LogoutConfirmation } from "../account";
import { useTheme } from "../theme";
import styles from "./PrivacyGate.module.css";
import { Button } from "../../shared/ui/Button";

export function PrivacyGate({
  children,
  onLogout,
  onSessionEnded,
}: {
  children: (requireNotice: () => void) => ReactNode;
  onLogout: () => Promise<void>;
  onSessionEnded: () => void;
}) {
  const [notice, setNotice] = useState<PrivacyNoticeResponse | null>(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [checked, setChecked] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [logoutPending, setLogoutPending] = useState(false);
  const [accountDeletionOpen, setAccountDeletionOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const requireNotice = useCallback(() => {
    setNotice(null);
    setChecked(false);
    setDeclined(false);
    setError("");
    setRevision((value) => value + 1);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void authenticatedRequest("/api/privacy", { signal: controller.signal })
      .then((response) => response.json())
      .then((value: PrivacyNoticeResponse) => {
        if (!controller.signal.aborted) setNotice(value);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) onSessionEnded();
        else setError("โหลดประกาศไม่สำเร็จ กรุณาลองอีกครั้ง");
      });
    return () => controller.abort();
  }, [revision, onSessionEnded]);

  if (notice?.accepted) return children(requireNotice);
  const accept = async () => {
    if (!notice || !checked || pending) return;
    setPending(true);
    setError("");
    try {
      await authenticatedRequest("/api/privacy/accept", {
        method: "POST",
        body: JSON.stringify({ version: notice.version }),
      });
      setNotice({ ...notice, accepted: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) onSessionEnded();
      else if (error instanceof ApiError && error.code === "NOTICE_CHANGED")
        requireNotice();
      else setError("บันทึกการยอมรับไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setPending(false);
    }
  };
  return (
    <main className={styles.page}>
      <section className={styles.notice} aria-labelledby="privacy-title">
        <button onClick={toggleTheme}>
          เปลี่ยนเป็นธีม{theme === "light" ? "มืด" : "สว่าง"}
        </button>
        <h1 id="privacy-title">ความเป็นส่วนตัวสำหรับ Pocka Beta</h1>
        {!notice && !error && <p role="status">กำลังโหลดประกาศ…</p>}
        {notice && (
          <>
            <p>เวอร์ชัน {notice.version}</p>
            {notice.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {declined && (
              <p role="status">
                คุณยังไม่ได้ยอมรับประกาศ จึงยังเข้าใช้ข้อมูลการเงินไม่ได้
                คุณสามารถอ่านประกาศและเปลี่ยนใจได้
              </p>
            )}
            <label>
              <input
                type="checkbox"
                checked={checked}
                disabled={pending}
                onChange={(event) => setChecked(event.target.checked)}
              />
              ฉันอ่านและยอมรับประกาศเวอร์ชันนี้
            </label>
            <div className={styles.actions}>
              <button
                disabled={!checked || pending}
                onClick={() => void accept()}
              >
                {pending ? "กำลังบันทึก…" : "ยอมรับและเข้าใช้งาน"}
              </button>
              <button
                disabled={pending}
                onClick={() => {
                  setDeclined(true);
                  setChecked(false);
                }}
              >
                ยังไม่ยอมรับ
              </button>
            </div>
          </>
        )}
        {error && <p role="alert">{error}</p>}
        {!notice && error && <button onClick={requireNotice}>ลองใหม่</button>}
        <button
          onClick={() => {
            setLogoutOpen(true);
            setLogoutError(null);
          }}
        >
          ออกจากระบบ
        </button>
        <Button
          variant="destructive"
          onClick={() => setAccountDeletionOpen(true)}
        >
          ขอลบบัญชี
        </Button>
      </section>
      {logoutOpen && (
        <LogoutConfirmation
          pending={logoutPending}
          error={logoutError}
          onCancel={() => setLogoutOpen(false)}
          onConfirm={() => {
            if (logoutPending) return;
            setLogoutPending(true);
            void onLogout().catch(() => {
              setLogoutPending(false);
              setLogoutError("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
            });
          }}
        />
      )}
      {accountDeletionOpen && (
        <AccountDeletionConfirmation
          onAccountDeletionCancel={() => setAccountDeletionOpen(false)}
          onAccountDeletionComplete={onSessionEnded}
        />
      )}
    </main>
  );
}
