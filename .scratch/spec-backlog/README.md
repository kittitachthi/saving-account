# Spec implementation backlog

Approved product breakdown: 27 tickets. Completed 01–05 on 2026-09-07, 06–08 and 10–12 on 2026-09-08, 13–14 on 2026-09-09, Wallet Sharing 16–22 on 2026-09-10, and 09/15/23–26 on 2026-09-14: 26/27 product tickets complete. Standards-migration tickets 28–31 were completed on 2026-09-09. Ticket 27 completed its local isolated backup, restore and reset rehearsal against disposable data; provider-native rehearsal with separate credentials and automatic verified backup deletion remains. Existing account-menu tickets are preserved.

Local tracking follows the existing repository convention; no external issues were published. Run `/setup-matt-pocock-skills` to configure an external tracker.

Sources: Daily Money Management spec (monthly totals), Interactive Dashboard Mascot spec and ADR-013 (01–05), Authenticated Wallet Sharing and Backend spec (07–24, 27), Account Menu/Current-Session Logout spec (06), Marketing/Beta Waitlist spec (25–26). Online Wallet reports now use Asia/Bangkok and occurredOn from ticket 11; legacy local data is preserved for ticket 15. ADR-010/011/013 are still marked proposed in the repository; do not silently mark them accepted.

Latest user override: successful Logout returns to Marketing without any logout-success notice. This overrides the older Account Menu spec wording. Session expiry/revocation has its own explanation and preserves the internal sign-in return path.

Verification for 06–08: 148 tests passed (45 API, 103 web), repository typecheck/lint/build passed and changed source formatting checked. HTTP integration uses real PostgreSQL for login/CSRF/renew/logout, with separate concurrent persistence and frontend lifecycle checks. See [session review](review-session-lifecycle.md).

Verification for 10–12: 174 tests passed (52 API, 122 web), typecheck/lint/build passed, changed source formatting checked. Real Chrome through Express/PostgreSQL verified consent and persisted income/saving/goal across 1280/390/320 widths, both themes and reduced motion. Full repository formatting still reports existing unrelated files. See [online Wallet review](review-online-wallet.md).

Verification for 01–05: 121 tests passed (35 API, 86 web), repository typecheck/lint/build passed, changed source formatting checked. Real Chrome verified widths 320/390/600/900/1280 in light/dark themes, reduced-motion feedback, visible Coming-soon status and no mascot overlap with balance/controls. See [review](review.md).

1. [แก้ยอดรายรับ/รายจ่ายเดือนนี้](issues/01-monthly-totals.md) — complete
2. [ซ่อนเปอร์เซ็นต์สมมติและแสดง Coming soon](issues/02-honest-dashboard.md) — complete
3. [แสดงมาสคอตบน Dashboard](issues/03-dashboard-mascot.md) — complete
4. [ให้มาสคอตตอบสนองต่อผลบันทึกรายการ](issues/04-mascot-reactions.md) — complete
5. [ให้มาสคอตหลับและตื่นตาม Activity](issues/05-mascot-afk.md) — complete
6. [แก้ Logout เมื่อ Session ไม่ถูกต้อง](issues/06-logout-invalid-session.md) — complete
7. [ป้องกัน CSRF สำหรับ authenticated mutations](issues/07-csrf-protection.md) — complete
8. [ต่ออายุ Session ตามการใช้งาน](issues/08-rolling-session.md) — complete
9. [ดูและเพิกถอน Session รายอุปกรณ์/ทุกอุปกรณ์](issues/09-device-sessions.md) — complete
10. [บังคับยอมรับ Beta Privacy Notice](issues/10-beta-privacy.md) — complete
11. [บันทึกและอ่านรายรับ/รายจ่ายจาก Personal Wallet ออนไลน์](issues/11-online-transactions.md) — complete
12. [จัดการเงินเก็บและ Savings Goal ออนไลน์](issues/12-online-savings.md) — complete
13. [แก้ไข Transaction ออนไลน์](issues/13-edit-transaction.md) — complete
14. [ลบและ Undo Transaction ออนไลน์](issues/14-delete-undo-online.md) — complete
15. [นำเข้าข้อมูลเดิมจากอุปกรณ์](issues/15-device-import.md) — complete
16. [Owner export ข้อมูล Wallet](issues/16-owner-export.md) — complete
17. [เชิญ Viewer และเปิด Wallet แบบอ่านอย่างเดียว](issues/17-invite-viewer.md) — complete
18. [ดูและยกเลิกคำเชิญที่ยังไม่ตอบรับ](issues/18-cancel-invitations.md) — complete
19. [เพิกถอน Viewer และออกจาก Wallet ที่แชร์](issues/19-revoke-leave.md) — complete
20. [แจ้งเตือนเมื่อสิทธิ์แชร์เปลี่ยน](issues/20-sharing-notifications.md) — complete
21. [แสดง Last Viewed At แบบประมาณ](issues/21-last-viewed.md) — complete
22. [เพิ่มมาตรการลดการเผยแพร่หน้าจอแชร์](issues/22-viewer-screen-privacy.md) — complete
23. [ขอลบบัญชีและกู้คืนภายใน 30 วัน](issues/23-account-deletion-recovery.md) — complete
24. [ลบบัญชีถาวรเมื่อครบกำหนด](issues/24-permanent-deletion.md) — complete
25. [ล้าง Waitlist ที่ครบอายุ 180 วัน](issues/25-waitlist-retention.md) — complete
26. [กำหนดและเปิดช่องทางถอนคำขอ Waitlist](issues/26-waitlist-withdrawal.md) — complete
27. [เตรียมกระบวนการ Beta Data Reset](issues/27-beta-data-reset.md) — deferred
28. [แยก CSS Module ตาม Transaction component](issues/28-transaction-component-styles.md) — complete
29. [ปรับชื่อ Transaction และ Wallet functions ฝั่ง web](issues/29-web-transaction-wallet-naming.md) — complete
30. [ปรับชื่อ Wallet functions ฝั่ง API](issues/30-api-wallet-naming.md) — complete
31. [ตรวจและปิดงานย้ายมาตรฐานรอบแรก](issues/31-standards-migration-verification.md) — complete
