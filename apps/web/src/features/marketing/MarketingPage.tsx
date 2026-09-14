import { useEffect, useRef, useState, type FormEvent } from "react";
import pockaMascot from "../../assets/pocka-mascot.png";
import googleSignInDark from "../../assets/googleicon.png";
import googleSignInLight from "../../assets/googleicon.png";
import { useBetaWaitlist } from "../beta-waitlist/useBetaWaitlist";
import type { Theme } from "../theme";
import { PockaBrandIcon } from "../../shared/ui/PockaBrandIcon";
import styles from "./MarketingPage.module.css";

type Props = {
  notice: string | null;
  returnTo: string;
  theme: Theme;
  onToggleTheme: () => void;
};

export function MarketingPage({
  notice,
  returnTo,
  theme,
  onToggleTheme,
}: Props) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [withdrawalEmail, setWithdrawalEmail] = useState("");
  const [withdrawalStatus, setWithdrawalStatus] = useState<
    "idle" | "pending" | "requested" | "withdrawn" | "error"
  >(() =>
    new URLSearchParams(window.location.search).has("waitlistWithdrawal")
      ? "pending"
      : "idle",
  );
  const waitlist = useBetaWaitlist();
  const loginTrigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!loginOpen) return;
    closeButton.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setLoginOpen(false);
      queueMicrotask(() => loginTrigger.current?.focus());
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [loginOpen]);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get(
      "waitlistWithdrawal",
    );
    if (!token) return;
    void fetch("/api/beta/waitlist/withdrawals/consume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((response) => {
        if (!response.ok) throw new Error();
        setWithdrawalStatus("withdrawn");
        window.history.replaceState({}, "", window.location.pathname);
      })
      .catch(() => setWithdrawalStatus("error"));
  }, []);

  const closeLogin = () => {
    setLoginOpen(false);
    queueMicrotask(() => loginTrigger.current?.focus());
  };

  const joinWaitlist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!consent) {
      waitlist.fail();
      return;
    }
    if (await waitlist.submit(email)) {
      setEmail("");
      setConsent(false);
    }
  };

  const handleWaitlistWithdrawalRequest = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setWithdrawalStatus("pending");
    try {
      const response = await fetch("/api/beta/waitlist/withdrawals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: withdrawalEmail }),
      });
      if (!response.ok) throw new Error();
      setWithdrawalStatus("requested");
      setWithdrawalEmail("");
    } catch {
      setWithdrawalStatus("error");
    }
  };

  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="เมนูหลัก">
        <a className={styles.brand} href="#top" aria-label="Pocka หน้าแรก">
          <PockaBrandIcon />
          Pocka
        </a>
        <div className={styles.navActions}>
          <a className={styles.featuresLink} href="#features">
            จุดเด่น
          </a>
          <button
            className={styles.themeButton}
            onClick={onToggleTheme}
            aria-label={`เปลี่ยนเป็นธีม${theme === "light" ? "มืด" : "สว่าง"}`}
          >
            {theme === "light" ? "☾" : "☀"}
          </button>
          <button
            ref={loginTrigger}
            className={styles.loginLink}
            onClick={() => setLoginOpen(true)}
          >
            เข้าสู่ระบบ
          </button>
          <a className={styles.primaryButton} href="#waitlist">
            ขอเข้าร่วม Beta
          </a>
        </div>
      </nav>
      {notice && (
        <p className={styles.pageNotice} role="status">
          {notice}
        </p>
      )}

      <section className={styles.hero} id="top">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>สมุดบัญชีที่ไม่รู้สึกเหมือนทำบัญชี</p>
          <h1>
            เงินหายไปไหน
            <br />
            <span>ให้ Pocka ช่วยหา</span>
          </h1>
          <p className={styles.lead}>
            จดง่าย เห็นชัด ว่าเงินไปไหน พร้อมแยกเงินเก็บและดูภาพรวมในที่เดียว
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButtonLarge} href="#waitlist">
              ขอเข้าร่วม Beta
            </a>
            <a className={styles.textLink} href="#features">
              ดูว่า Pocka ช่วยอะไรได้บ้าง ↓
            </a>
          </div>
          <p className={styles.betaNote}>
            Private Beta · สำหรับผู้ได้รับเชิญเข้าร่วมทดลองใช้งาน
          </p>
        </div>
        <div className={styles.mascotStage} aria-hidden="true">
          <div className={styles.mascotGlow} />
          <img src={pockaMascot} alt="" className={styles.mascot} />
          <div className={`${styles.floatingCard} ${styles.expenseCard}`}>
            <span>วันนี้ใช้ไป</span>
            <strong>฿245</strong>
          </div>
          <div className={`${styles.floatingCard} ${styles.balanceCard}`}>
            <span>ยังเหลือใช้</span>
            <strong>฿8,420</strong>
          </div>
        </div>
      </section>

      <section
        className={styles.features}
        id="features"
        aria-labelledby="features-title"
      >
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>เรื่องเงินที่เข้าใจง่ายขึ้น</p>
          <h2 id="features-title">
            เห็นภาพเงินของคุณ
            <br />
            โดยไม่ต้องเก่งตัวเลข
          </h2>
        </div>
        <div className={styles.featureGrid}>
          <article>
            <span className={styles.featureIcon}>✎</span>
            <h3>จดได้ในไม่กี่วินาที</h3>
            <p>
              เพิ่มรายรับ รายจ่าย และเงินเก็บได้ง่าย
              พร้อมหมวดหมู่ที่ช่วยให้ย้อนดูแล้วเข้าใจทันที
            </p>
          </article>
          <article>
            <span className={styles.featureIcon}>◒</span>
            <h3>รู้ว่าเงินไปอยู่ตรงไหน</h3>
            <p>
              กราฟภาพรวมช่วยเปลี่ยนรายการยาว ๆ ให้เป็นสัดส่วนที่มองแล้วรู้เรื่อง
            </p>
          </article>
          <article>
            <span className={styles.featureIcon}>◎</span>
            <h3>แยกเงินเก็บออกจากเงินใช้</h3>
            <p>
              เห็นยอดพร้อมใช้จริง ตั้งเป้าหมาย
              และติดตามความคืบหน้าของเงินเก็บได้ในที่เดียว
            </p>
          </article>
        </div>
      </section>

      <section className={styles.preview} aria-labelledby="preview-title">
        <div className={styles.previewCopy}>
          <p className={styles.eyebrow}>ภาพรวมที่เล่าเรื่องได้</p>
          <h2 id="preview-title">
            เปิดมาก็รู้เลยว่า
            <br />
            เดือนนี้เป็นอย่างไร
          </h2>
          <p>
            ไม่ต้องไล่บวกรายการเอง Pocka สรุปยอดพร้อมใช้ รายจ่าย
            และเงินเก็บให้เห็นในหน้าเดียว
          </p>
          <div className={styles.sharedNote}>
            <span>♧</span>
            <div>
              <strong>แบ่งปันเมื่อคุณต้องการ</strong>
              <p>แชร์กระเป๋าให้คนที่ไว้ใจดูได้ โดยอีกฝ่ายแก้ไขข้อมูลไม่ได้</p>
            </div>
          </div>
        </div>
        <div
          className={styles.dashboardMockup}
          aria-label="ตัวอย่างภาพรวมจากข้อมูลสมมติ"
        >
          <div className={styles.mockupTop}>
            <span>ภาพรวมเดือนนี้</span>
            <small>ข้อมูลตัวอย่าง</small>
          </div>
          <div className={styles.summaryCards}>
            <div>
              <span>เงินพร้อมใช้</span>
              <strong>฿18,750</strong>
            </div>
            <div>
              <span>เก็บแล้ว</span>
              <strong>฿6,500</strong>
            </div>
          </div>
          <div className={styles.chartRow}>
            <div className={styles.donut}>
              <span>
                ฿12,840<small>รายจ่าย</small>
              </span>
            </div>
            <ul>
              <li>
                <i />
                อาหาร <b>38%</b>
              </li>
              <li>
                <i />
                เดินทาง <b>24%</b>
              </li>
              <li>
                <i />
                ของใช้ <b>18%</b>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section
        className={styles.waitlist}
        id="waitlist"
        aria-labelledby="waitlist-title"
      >
        <div>
          <p className={styles.eyebrow}>มาลอง Pocka ก่อนใคร</p>
          <h2 id="waitlist-title">ขอเข้าร่วม Private Beta</h2>
          <p>ทิ้งอีเมลไว้ หากได้รับสิทธิ์เราจะส่งลิงก์เข้าสู่ระบบให้ทางอีเมล</p>
        </div>
        {withdrawalStatus === "withdrawn" && (
          <p role="status">ถอนคำขอเข้าร่วม Beta แล้ว</p>
        )}
        {waitlist.state === "success" ? (
          <div className={styles.success} role="status">
            <strong>รับคำขอแล้ว ✓</strong>
            <span>หากได้รับสิทธิ์ เราจะแจ้งผ่านอีเมลนี้</span>
            <button onClick={waitlist.reset}>ส่งอีเมลอื่น</button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={joinWaitlist}>
            <label htmlFor="waitlist-email">อีเมล</label>
            <div className={styles.inputRow}>
              <input
                id="waitlist-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
              <button disabled={waitlist.state === "submitting"}>
                {waitlist.state === "submitting"
                  ? "กำลังส่ง…"
                  : "ขอเข้าร่วม Beta"}
              </button>
            </div>
            <label className={styles.consent}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <span>
                ฉันยินยอมให้ Pocka ใช้อีเมลเพื่อติดต่อเกี่ยวกับการทดลองใช้งาน
                Beta ตาม <a href="#privacy">ประกาศความเป็นส่วนตัว</a>
              </span>
            </label>
            <p className={styles.formNote}>
              การส่งคำขอไม่ได้หมายความว่าจะได้รับสิทธิ์เข้าใช้ทันที
            </p>
            {waitlist.state === "error" && (
              <p className={styles.formError} role="alert">
                ส่งคำขอไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองอีกครั้ง
              </p>
            )}
          </form>
        )}
        <details className={styles.privacy} id="privacy">
          <summary>ประกาศความเป็นส่วนตัวสำหรับ Beta Waitlist</summary>
          <p>
            Pocka เก็บอีเมลและเวลาที่คุณให้ความยินยอมเพื่อพิจารณาและติดต่อเรื่อง
            Private Beta เท่านั้น ไม่ใช้ส่งข่าวสารการตลาดทั่วไป
            คำขอที่ยังไม่ได้รับอนุมัติจะเก็บไม่เกิน 180 วัน
            การส่งคำขอไม่รับประกันสิทธิ์เข้าใช้
            คุณสามารถขอถอนคำขอได้ทางลิงก์ยืนยันที่ส่งไปยังอีเมลของคุณ
          </p>
        </details>
        <details className={styles.privacy}>
          <summary>ถอนคำขอเข้าร่วม Beta</summary>
          <form
            className={styles.form}
            onSubmit={handleWaitlistWithdrawalRequest}
          >
            <label htmlFor="waitlist-withdrawal-email">
              อีเมลที่ใช้ส่งคำขอ
            </label>
            <div className={styles.inputRow}>
              <input
                id="waitlist-withdrawal-email"
                type="email"
                required
                value={withdrawalEmail}
                onChange={(event) => setWithdrawalEmail(event.target.value)}
              />
              <button disabled={withdrawalStatus === "pending"}>
                ส่งลิงก์ยืนยัน
              </button>
            </div>
            {withdrawalStatus === "requested" && (
              <p role="status">
                หากมีคำขอที่ถอนได้ ระบบจะส่งลิงก์ยืนยันไปยังอีเมลนี้
              </p>
            )}
            {withdrawalStatus === "error" && (
              <p role="alert">ส่งคำขอไม่สำเร็จ กรุณาลองอีกครั้ง</p>
            )}
          </form>
        </details>
      </section>

      <footer className={styles.footer}>
        <span>Pocka · พ็อกก้า</span>
        <span>เข้าใจเงินง่ายขึ้น ทีละรายการ</span>
      </footer>

      {loginOpen && (
        <div className={styles.backdrop} onMouseDown={closeLogin}>
          <section
            className={styles.loginDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            onMouseDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              const controls =
                event.currentTarget.querySelectorAll<HTMLElement>(
                  "button:not([disabled]), a[href]",
                );
              const first = controls.item(0);
              const last = controls.item(controls.length - 1);
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            }}
          >
            <button
              className={styles.dialogThemeButton}
              onClick={onToggleTheme}
              aria-label={`เปลี่ยนเป็นธีม${theme === "light" ? "มืด" : "สว่าง"}`}
            >
              {theme === "light" ? "☾" : "☀"}
            </button>
            <button
              ref={closeButton}
              className={styles.closeButton}
              onClick={closeLogin}
              aria-label="ปิดหน้าต่างเข้าสู่ระบบ"
            >
              ×
            </button>
            <div className={styles["pocka-login-brand-container"]}>
              <PockaBrandIcon size="dialog" />
            </div>
            <h2 id="login-title">ยินดีต้อนรับกลับมา</h2>
            <p>เข้าสู่ระบบสำหรับผู้ที่ได้รับเชิญเข้าร่วม Pocka Private Beta</p>
            <a
              className={`${styles.googleButton} ${theme === "dark" ? styles.googleDark : ""}`}
              href={`/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`}
            >
              <img
                src={theme === "dark" ? googleSignInDark : googleSignInLight}
                alt=""
              />
              เข้าสู่ระบบด้วย Google
            </a>
            <small>Google จะใช้เพื่อยืนยันตัวตนเท่านั้น</small>
          </section>
        </div>
      )}
    </main>
  );
}
