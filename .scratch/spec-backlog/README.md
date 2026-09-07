# Spec implementation backlog

Approved breakdown: 27 tickets. User selected only 01–05 for this implementation batch on 2026-09-07. Tickets 06–27 are recorded for later selection; `ready-for-agent` describes ticket readiness, not permission to start them. Existing account-menu tickets are preserved.

Local tracking follows the existing repository convention; no external issues were published. Run `/setup-matt-pocock-skills` to configure an external tracker.

Sources: Daily Money Management spec (monthly totals), Interactive Dashboard Mascot spec and ADR-013 (01–05), Authenticated Wallet Sharing and Backend spec (07–24, 27), Account Menu/Current-Session Logout spec (06), Marketing/Beta Waitlist spec (25–26). For 01, browser timezone/createdAt stay in use until 11 introduces Wallet Timezone/occurredOn. ADR-010/011/013 are still marked proposed in the repository; do not silently mark them accepted.

Latest user override: successful Logout returns to Marketing without any logout-success notice. This overrides the older Account Menu spec wording; ticket 06 still concerns invalid Session handling only and remains deferred.

Verification for 01–05: 121 tests passed (35 API, 86 web), repository typecheck/lint/build passed, changed source formatting checked. Real Chrome verified widths 320/390/600/900/1280 in light/dark themes, reduced-motion feedback, visible Coming-soon status and no mascot overlap with balance/controls. See [review](review.md).

1. [แก้ยอดรายรับ/รายจ่ายเดือนนี้](issues/01-monthly-totals.md) — complete
2. [ซ่อนเปอร์เซ็นต์สมมติและแสดง Coming soon](issues/02-honest-dashboard.md) — complete
3. [แสดงมาสคอตบน Dashboard](issues/03-dashboard-mascot.md) — complete
4. [ให้มาสคอตตอบสนองต่อผลบันทึกรายการ](issues/04-mascot-reactions.md) — complete
5. [ให้มาสคอตหลับและตื่นตาม Activity](issues/05-mascot-afk.md) — complete
6. [แก้ Logout เมื่อ Session ไม่ถูกต้อง](issues/06-logout-invalid-session.md) — deferred
7. [ป้องกัน CSRF สำหรับ authenticated mutations](issues/07-csrf-protection.md) — deferred
8. [ต่ออายุ Session ตามการใช้งาน](issues/08-rolling-session.md) — deferred
9. [ดูและเพิกถอน Session รายอุปกรณ์/ทุกอุปกรณ์](issues/09-device-sessions.md) — deferred
10. [บังคับยอมรับ Beta Privacy Notice](issues/10-beta-privacy.md) — deferred
11. [บันทึกและอ่านรายรับ/รายจ่ายจาก Personal Wallet ออนไลน์](issues/11-online-transactions.md) — deferred
12. [จัดการเงินเก็บและ Savings Goal ออนไลน์](issues/12-online-savings.md) — deferred
13. [แก้ไข Transaction ออนไลน์](issues/13-edit-transaction.md) — deferred
14. [ลบและ Undo Transaction ออนไลน์](issues/14-delete-undo-online.md) — deferred
15. [นำเข้าข้อมูลเดิมจากอุปกรณ์](issues/15-device-import.md) — deferred
16. [Owner export ข้อมูล Wallet](issues/16-owner-export.md) — deferred
17. [เชิญ Viewer และเปิด Wallet แบบอ่านอย่างเดียว](issues/17-invite-viewer.md) — deferred
18. [ดูและยกเลิกคำเชิญที่ยังไม่ตอบรับ](issues/18-cancel-invitations.md) — deferred
19. [เพิกถอน Viewer และออกจาก Wallet ที่แชร์](issues/19-revoke-leave.md) — deferred
20. [แจ้งเตือนเมื่อสิทธิ์แชร์เปลี่ยน](issues/20-sharing-notifications.md) — deferred
21. [แสดง Last Viewed At แบบประมาณ](issues/21-last-viewed.md) — deferred
22. [เพิ่มมาตรการลดการเผยแพร่หน้าจอแชร์](issues/22-viewer-screen-privacy.md) — deferred
23. [ขอลบบัญชีและกู้คืนภายใน 30 วัน](issues/23-account-deletion-recovery.md) — deferred
24. [ลบบัญชีถาวรเมื่อครบกำหนด](issues/24-permanent-deletion.md) — deferred
25. [ล้าง Waitlist ที่ครบอายุ 180 วัน](issues/25-waitlist-retention.md) — deferred
26. [กำหนดและเปิดช่องทางถอนคำขอ Waitlist](issues/26-waitlist-withdrawal.md) — deferred
27. [เตรียมกระบวนการ Beta Data Reset](issues/27-beta-data-reset.md) — deferred
