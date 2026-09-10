import { useCallback, useEffect, useState, type FormEvent } from "react";
import type {
  WalletInvitation,
  WalletSummary,
  WalletViewer,
} from "@saving-account/contracts";
import { authenticatedRequest } from "../auth";
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
}: {
  wallets: WalletSummary[];
  wallet: WalletSummary;
  onWalletChange: (walletId: string) => void;
  onAccessEnded: () => void;
  onClose: () => void;
}) {
  const [overview, setOverview] = useState<SharingOverview | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const walletSharingOverviewReload = useCallback(async () => {
    if (wallet.role !== "owner") return;
    const response = await authenticatedRequest(
      `/api/wallets/${wallet.id}/sharing`,
    );
    setOverview((await response.json()) as SharingOverview);
  }, [wallet.id, wallet.role]);
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
    await authenticatedRequest(`/api/wallets/${wallet.id}/${path}`, {
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
          <h2 id="wallet-sharing-title">
            {wallet.role === "owner"
              ? "จัดการการแชร์"
              : "ข้อมูล Wallet ที่แชร์"}
          </h2>
          <button autoFocus aria-label="ปิดข้อมูลการแชร์" onClick={onClose}>
            ×
          </button>
        </header>
        <label>
          Wallet{" "}
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
          <>
            <p>
              ดูได้อย่างเดียว · เจ้าของ {wallet.owner.displayName} (
              {wallet.owner.email})
            </p>
            <p>คำเตือน: Web/PWA ไม่สามารถป้องกันภาพหน้าจอได้ทั้งหมด</p>
            <button
              onClick={() => {
                if (window.confirm("ออกจาก Wallet ที่แชร์นี้หรือไม่?"))
                  void walletSharingMutationRequest("leave", "POST").then(
                    onAccessEnded,
                  );
              }}
            >
              ออกจาก Wallet นี้
            </button>
          </>
        ) : (
          <>
            <a href={`/api/wallets/${wallet.id}/export`} download>
              ดาวน์โหลดข้อมูล Wallet
            </a>
            <form onSubmit={handleWalletInvitationSubmit}>
              <label>
                อีเมล Viewer{" "}
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <button>ส่งคำเชิญ</button>
            </form>
            {message && <p role="status">{message}</p>}
            {(overview?.invitations ?? []).map((item) => (
              <div key={item.id}>
                <span>
                  {item.email} ·{" "}
                  {item.status === "expired" ? "หมดอายุ" : "รอตอบรับ"}
                </span>
                {item.status === "pending" && (
                  <button
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
            {(overview?.viewers ?? []).map((viewer) => (
              <div key={viewer.userId}>
                <span>
                  {viewer.displayName} · {viewer.email} · ดูล่าสุดโดยประมาณ{" "}
                  {viewer.lastViewedAt
                    ? new Date(viewer.lastViewedAt).toLocaleString("th-TH")
                    : "ยังไม่มี"}
                </span>
                <button
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
          </>
        )}
      </section>
    </Overlay>
  );
}
