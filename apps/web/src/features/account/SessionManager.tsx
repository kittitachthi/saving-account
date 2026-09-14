import { useEffect, useState } from "react";
import type { AuthDeviceSession } from "@saving-account/contracts";
import { authenticatedRequest } from "../auth";
import { Button } from "../../shared/ui/Button";
import styles from "./SessionManager.module.css";

export function SessionManager({
  onSessionEnded,
}: {
  onSessionEnded: () => void;
}) {
  const [sessions, setSessions] = useState<AuthDeviceSession[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void authenticatedRequest("/api/auth/sessions")
      .then((response) => response.json())
      .then(setSessions)
      .catch(() => setError("โหลดรายการอุปกรณ์ไม่สำเร็จ"));
  }, []);

  const sessionRevoke = async (session: AuthDeviceSession) => {
    setPending(true);
    setError("");
    try {
      await authenticatedRequest(`/api/auth/sessions/${session.id}`, {
        method: "DELETE",
      });
      if (session.current) onSessionEnded();
      else
        setSessions((current) => current.filter(({ id }) => id !== session.id));
    } catch {
      setError("เพิกถอนอุปกรณ์ไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setPending(false);
    }
  };

  const sessionsRevokeAll = async () => {
    setPending(true);
    setError("");
    try {
      await authenticatedRequest("/api/auth/sessions", { method: "DELETE" });
      onSessionEnded();
    } catch {
      setError("ออกจากระบบทุกอุปกรณ์ไม่สำเร็จ กรุณาลองอีกครั้ง");
      setPending(false);
    }
  };

  return (
    <section
      className={styles["session-manager-container"]}
      aria-label="อุปกรณ์ที่เข้าสู่ระบบ"
    >
      <div>
        <b>อุปกรณ์ที่เข้าสู่ระบบ</b>
        <small>จัดการเซสชันที่ยังใช้งานอยู่</small>
      </div>
      {error && <p role="alert">{error}</p>}
      <ul>
        {sessions.map((session) => (
          <li key={session.id}>
            <span>
              <b>
                {session.deviceLabel}
                {session.current ? " · อุปกรณ์นี้" : ""}
              </b>
              <small>
                ใช้งานล่าสุด{" "}
                {new Date(session.lastSeenAt).toLocaleString("th-TH")}
              </small>
            </span>
            <Button
              disabled={pending}
              onClick={() => void sessionRevoke(session)}
            >
              {session.current ? "ออกจากระบบ" : "เพิกถอน"}
            </Button>
          </li>
        ))}
      </ul>
      {sessions.length > 1 && (
        <Button
          variant="destructive"
          pending={pending}
          onClick={() => void sessionsRevokeAll()}
        >
          ออกจากระบบทุกอุปกรณ์
        </Button>
      )}
    </section>
  );
}
