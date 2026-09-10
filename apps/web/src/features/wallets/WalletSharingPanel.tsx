import { useCallback, useEffect, useState, type FormEvent } from "react";
import type {
  WalletInvitation,
  WalletSummary,
  WalletViewer,
} from "@saving-account/contracts";
import { Overlay } from "../../shared/ui/Overlay";
import styles from "./WalletSharingPanel.module.css";

type SharingOverview = {
  invitations: WalletInvitation[];
  viewers: WalletViewer[];
};

export function WalletSharingPanel({
  wallets,
  wallet,
  onWalletChange,
  onAccessEnded,
  onClose,
  walletRequest,
}: {
  wallets: WalletSummary[];
  wallet: WalletSummary;
  onWalletChange: (walletId: string) => void;
  onAccessEnded: () => void;
  onClose: () => void;
  walletRequest: (path: string, options?: RequestInit) => Promise<Response>;
}) {
  const [overview, setOverview] = useState<SharingOverview | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const walletSharingOverviewReload = useCallback(async () => {
    if (wallet.role !== "owner") return;
    const response = await walletRequest(`/api/wallets/${wallet.id}/sharing`);
    setOverview((await response.json()) as SharingOverview);
  }, [wallet.id, wallet.role, walletRequest]);
  useEffect(() => {
    queueMicrotask(() => void walletSharingOverviewReload());
  }, [walletSharingOverviewReload]);
  useEffect(() => {
    const handleWalletSharingKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleWalletSharingKeyDown);
    return () =>
      window.removeEventListener("keydown", handleWalletSharingKeyDown);
  }, [onClose]);
  const walletSharingMutationRequest = async (
    path: string,
    method: string,
    body?: unknown,
  ) => {
    setMessage("");
    await walletRequest(`/api/wallets/${wallet.id}/${path}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
    await walletSharingOverviewReload();
  };
  const handleWalletInvitationSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !window.confirm(
        "Web/PWA ป้องกันภาพหน้าจอไม่ได้ทั้งหมด ต้องการส่งคำเชิญแบบอ่านอย่างเดียวหรือไม่?",
      )
    )
      return;
    void walletSharingMutationRequest("invitations", "POST", { email })
      .then(() => {
        setEmail("");
        setMessage("ส่งคำเชิญแล้ว");
      })
      .catch(() => setMessage("ส่งคำเชิญไม่สำเร็จ"));
  };
  return (
    <Overlay onDismiss={onClose}>
      <section
        className={styles["wallet-sharing-dialog"]}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-sharing-title"
      >
        <header className={styles["wallet-sharing-header"]}>
          <div className={styles["wallet-sharing-heading"]}>
            <span
              className={styles["wallet-sharing-heading-icon"]}
              aria-hidden="true"
            >
              ◎
            </span>
            <div>
              <h2 id="wallet-sharing-title">
                {wallet.role === "owner"
                  ? "จัดการการแชร์"
                  : "ข้อมูล Wallet ที่แชร์"}
              </h2>
              <p>
                {wallet.role === "owner"
                  ? "เชิญคนอื่นให้ดูข้อมูล Wallet นี้ได้"
                  : "คุณได้รับสิทธิ์ให้ดู Wallet นี้"}
              </p>
            </div>
          </div>
          <button
            className={styles["wallet-sharing-close-button"]}
            autoFocus
            aria-label="ปิดข้อมูลการแชร์"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <label className={styles["wallet-sharing-wallet-field"]}>
          <span>Wallet ที่กำลังจัดการ</span>
          <select
            value={wallet.id}
            onChange={(event) => onWalletChange(event.target.value)}
          >
            {wallets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.role === "owner"
                  ? "ส่วนตัว"
                  : `แชร์โดย ${item.owner.displayName}`}{" "}
                · {item.name}
              </option>
            ))}
          </select>
        </label>
        {wallet.role === "viewer" ? (
          <div className={styles["wallet-sharing-viewer-content"]}>
            <section className={styles["wallet-sharing-owner-card"]}>
              <span
                className={styles["wallet-sharing-owner-avatar"]}
                aria-hidden="true"
              >
                {wallet.owner.displayName.slice(0, 1).toUpperCase()}
              </span>
              <div className={styles["wallet-sharing-owner-details"]}>
                <span className={styles["wallet-sharing-owner-label"]}>
                  เจ้าของ Wallet
                </span>
                <strong>{wallet.owner.displayName}</strong>
                <span>{wallet.owner.email}</span>
              </div>
              <span className={styles["wallet-sharing-readonly-badge"]}>
                ดูได้อย่างเดียว
              </span>
            </section>
            <p className={styles["wallet-sharing-privacy-note"]}>
              <span aria-hidden="true">ⓘ</span>
              Web/PWA ไม่สามารถป้องกันภาพหน้าจอได้ทั้งหมด
            </p>
            <button
              className={styles["wallet-sharing-leave-button"]}
              onClick={() => {
                if (window.confirm("ออกจาก Wallet ที่แชร์นี้หรือไม่?"))
                  void walletSharingMutationRequest("leave", "POST").then(
                    onAccessEnded,
                  );
              }}
            >
              ออกจาก Wallet นี้
            </button>
          </div>
        ) : (
          <div className={styles["wallet-sharing-owner-content"]}>
            <section className={styles["wallet-sharing-section"]}>
              <div className={styles["wallet-sharing-section-heading"]}>
                <div>
                  <h3>เชิญ Viewer</h3>
                  <p>ผู้รับคำเชิญจะเปิดดูข้อมูลได้ แต่แก้ไขไม่ได้</p>
                </div>
                <a
                  className={styles["wallet-sharing-export-link"]}
                  href={`/api/wallets/${wallet.id}/export`}
                  download
                >
                  <span aria-hidden="true">↓</span>
                  ดาวน์โหลดข้อมูล Wallet
                </a>
              </div>
              <form
                className={styles["wallet-sharing-invitation-form"]}
                onSubmit={handleWalletInvitationSubmit}
              >
                <label className={styles["wallet-sharing-email-field"]}>
                  <span>อีเมล Viewer</span>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
                <button className={styles["wallet-sharing-invite-button"]}>
                  ส่งคำเชิญ
                </button>
              </form>
              {message && (
                <p
                  className={styles["wallet-sharing-status-message"]}
                  role="status"
                >
                  {message}
                </p>
              )}
            </section>

            <section className={styles["wallet-sharing-section"]}>
              <h3>คำเชิญที่ส่งแล้ว</h3>
              {(overview?.invitations ?? []).length === 0 ? (
                <p className={styles["wallet-sharing-empty-message"]}>
                  ยังไม่มีคำเชิญที่รอตอบรับ
                </p>
              ) : (
                <div className={styles["wallet-sharing-list"]}>
                  {(overview?.invitations ?? []).map((item) => (
                    <div
                      className={styles["wallet-sharing-list-row"]}
                      key={item.id}
                    >
                      <div className={styles["wallet-sharing-list-details"]}>
                        <strong>{item.email}</strong>
                        <span>{
                          item.status === "expired" ? "หมดอายุ" : "รอตอบรับ"
                        }</span>
                      </div>
                      {item.status === "pending" && (
                        <button
                          className={styles["wallet-sharing-cancel-button"]}
                          onClick={() =>
                            void walletSharingMutationRequest(
                              `invitations/${item.id}`,
                              "DELETE",
                            )
                          }
                        >
                          ยกเลิก
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={styles["wallet-sharing-section"]}>
              <h3>ผู้ที่เข้าถึงได้</h3>
              {(overview?.viewers ?? []).length === 0 ? (
                <p className={styles["wallet-sharing-empty-message"]}>
                  ยังไม่มี Viewer ใน Wallet นี้
                </p>
              ) : (
                <div className={styles["wallet-sharing-list"]}>
                  {(overview?.viewers ?? []).map((viewer) => (
                    <div
                      className={styles["wallet-sharing-list-row"]}
                      key={viewer.userId}
                    >
                      <span
                        className={styles["wallet-sharing-viewer-avatar"]}
                        aria-hidden="true"
                      >
                        {viewer.displayName.slice(0, 1).toUpperCase()}
                      </span>
                      <div className={styles["wallet-sharing-list-details"]}>
                        <strong>{viewer.displayName}</strong>
                        <span>{viewer.email}</span>
                        <small>
                          ดูล่าสุดโดยประมาณ{" "}
                          {viewer.lastViewedAt
                            ? new Date(viewer.lastViewedAt).toLocaleString(
                                "th-TH",
                              )
                            : "ยังไม่มี"}
                        </small>
                      </div>
                      <button
                        className={styles["wallet-sharing-revoke-button"]}
                        onClick={() =>
                          void walletSharingMutationRequest(
                            `viewers/${viewer.userId}`,
                            "DELETE",
                          )
                        }
                      >
                        เพิกถอน
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </Overlay>
  );
}
