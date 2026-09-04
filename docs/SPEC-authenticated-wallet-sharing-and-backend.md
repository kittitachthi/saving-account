# Spec: ระบบบัญชี กระเป๋าออนไลน์ และการแชร์แบบอ่านอย่างเดียว

## Problem Statement

ปัจจุบันแอปเก็บ Transaction และ Savings Goal ไว้ใน `localStorage` ของ browser ทำให้ข้อมูลผูกกับอุปกรณ์เดียว ไม่มีการยืนยันตัวตน ไม่มีแหล่งข้อมูลกลาง และไม่สามารถแชร์ Wallet ให้บุคคลที่ไว้ใจดูข้อมูลล่าสุดได้อย่างควบคุมสิทธิ์ การเพิ่ม Google Authentication, การใช้งานหลายอุปกรณ์ และ Read-only Share จำเป็นต้องมี backend, ฐานข้อมูล, session, authorization และกระบวนการดูแลข้อมูลที่ตรวจสอบได้ โดยต้องไม่ทำให้กฎทางการเงินและประสบการณ์ใช้งานเดิมสูญหาย

ทีมยังต้องการโครงสร้างที่ developer ทั่วไปสามารถเรียนรู้ ดูแล ทดสอบ และ deploy ได้โดยไม่พึ่ง abstraction เฉพาะโครงการ พร้อม beta environment ที่จำกัดผู้ทดลองและสื่อสารอย่างตรงไปตรงมาว่าข้อมูลอาจถูก reset และ Web/PWA ไม่สามารถป้องกัน screenshot ได้อย่างสมบูรณ์

## Solution

ปรับ repository เป็น TypeScript monorepo ที่มี React web application, Express API และ HTTP contracts ที่ใช้ร่วมกัน โดยใช้ PostgreSQL และ Prisma เป็น source of truth ของข้อมูล ผู้ใช้เข้าสู่ระบบด้วย Google OpenID Connect ผ่าน server-side Session และเข้าถึงข้อมูลการเงินทั้งหมดผ่าน Protected Route และ API ที่ตรวจสิทธิ์จาก Wallet Membership ทุกครั้ง

ระบบสร้าง Personal Wallet หลักให้ผู้ใช้แต่ละคน รองรับ Owner คนเดียวต่อ Wallet และให้ Owner เชิญผู้ใช้ Google Account ที่ระบุมาเป็น Viewer ผ่าน Wallet Invitation แบบใช้ครั้งเดียวและหมดอายุ Viewer อ่านข้อมูล Wallet ล่าสุดได้แต่เปลี่ยนแปลงหรือ export ไม่ได้ ขณะที่ Owner จัดการ Viewer, Transaction, Savings Goal และการ export ได้ ระบบรองรับการนำข้อมูลเดิมจากอุปกรณ์อย่างยืนยันก่อนและทำซ้ำได้อย่างปลอดภัย รวมถึง Session management, Account Deletion ที่กู้คืนได้ 30 วัน, Security Notification และข้อกำหนด beta/privacy ที่จำเป็นต่อการทดลองใช้งานจริง

## User Stories

1. As a new beta user, I want to sign in with an allowlisted Google Account, so that I can use the application without creating another password.
2. As a non-allowlisted visitor, I want a neutral rejection message, so that account and allowlist information is not disclosed.
3. As a user, I want all financial pages protected by a valid Session, so that unauthenticated visitors cannot see my data.
4. As a returning user, I want my active Session renewed while I use the application, so that I am not interrupted unnecessarily.
5. As a user whose Session expired, I want to return safely to my original in-app page after signing in, so that I can continue my work.
6. As a user, I want to view and revoke Sessions by device, so that I can remove access from a device I no longer trust.
7. As a user, I want to sign out from all devices, so that I can quickly secure my account.
8. As a user, I want backend logout to revoke the Session and clear its cookie, so that navigation alone cannot leave an active credential behind.
9. As a first-time user, I want a Personal Wallet created for me, so that I can begin recording my finances.
10. As a user, I want my Personal Wallet separated from Wallets shared with me, so that I always know whose information I am viewing.
11. As a Viewer, I want the Owner identified clearly, so that I do not mistake a shared Wallet for my own.
12. As an Owner, I want to create, edit, and delete Transactions, so that my Wallet remains accurate.
13. As an Owner, I want to manage my Savings Goal, so that I can track Savings Progress.
14. As an Owner, I want every Money Amount calculated exactly in satang, so that rounding errors do not alter my balance.
15. As a user, I want THB amounts formatted in baht with at most two decimal places, so that monetary values are easy to read.
16. As an Owner, I want to record the date a Transaction occurred, so that reports reflect the real event rather than entry time.
17. As an Owner, I want the occurred time to be optional, so that I can record a Transaction even when I do not remember the exact time.
18. As a user, I want Transactions without an occurred time to show only their date, so that midnight is not presented as a fact.
19. As a user, I want Transactions sorted deterministically, so that the same data appears consistently across devices.
20. As a user, I want “today” and monthly summaries calculated in the Wallet Timezone, so that reports agree across devices.
21. As an Owner, I want to invite a Viewer by email, so that a trusted person can see my Wallet.
22. As an intended recipient, I want to sign in with the Google email named by the invitation, so that another account cannot accept it.
23. As an invitee, I want to review and explicitly accept an invitation, so that access is never created without my consent.
24. As an Owner, I want an unanswered invitation to expire after seven days, so that old links do not remain valid indefinitely.
25. As an Owner, I want to cancel a pending invitation, so that I can withdraw it before acceptance.
26. As a user, I want an invitation token to work only once, so that replaying a used, expired, or cancelled link cannot create access.
27. As a Viewer, I want to see the Wallet's existing and newly updated financial data, so that the share remains current rather than becoming a snapshot.
28. As a Viewer, I want to see Transaction details, categories, Savings Goal, and summaries, so that the read-only view is useful.
29. As a Viewer, I want to see when an existing Transaction was last edited, so that I can recognize recent changes.
30. As a Viewer, I want mutation controls omitted from the interface, so that the limits of my role are clear.
31. As an Owner, I want the backend to reject every mutation attempted by a Viewer, so that authorization does not depend on hidden buttons.
32. As a Viewer, I want export and download unavailable, so that the shared access remains intentionally limited.
33. As an Owner, I want to export a Wallet I own, so that I can retain a portable copy of my data.
34. As an Owner, I want to see all current Viewers, so that I know who can access my Wallet.
35. As an Owner, I want to revoke a Viewer immediately, so that every subsequent request from that Viewer is denied.
36. As a Viewer, I want to leave a shared Wallet after one confirmation, so that I can end my Membership without waiting for the Owner.
37. As an Owner, I want a Security Notification when a Viewer accepts, leaves, or is revoked, so that access changes are visible.
38. As an Owner, I want to see a Viewer's approximate Last Viewed At value, so that I understand whether the shared Wallet is being opened.
39. As a Viewer, I want Last Viewed At to remain coarse and limited to Wallet access, so that the application does not build a page-level viewing history.
40. As an email recipient, I want Security Notifications to exclude Money Amounts and Transaction details, so that email does not leak financial data.
41. As a user with existing device data, I want to review the type and count of local data before import, so that sign-in does not upload it unexpectedly.
42. As a user with existing device data, I want to choose between importing and starting fresh, so that I control migration to my Personal Wallet.
43. As a user importing device data, I want retries to avoid duplicate Transactions and Savings Goals, so that network errors do not corrupt totals.
44. As a user importing device data, I want invalid items reported without silently changing their meaning, so that I can understand what was not migrated.
45. As a user who completed import, I want the device marked as imported without exposing financial details, so that I am not repeatedly prompted.
46. As a beta tester, I want to read and accept the current Beta Privacy Notice before accessing finances, so that I understand how the beta handles my data.
47. As a beta tester, I want material notice changes to require fresh consent, so that my earlier consent is not applied to new terms silently.
48. As a beta tester who declines the notice, I want access limited to explanation, logout, and Account Deletion, so that no financial data is created or shown.
49. As a beta tester, I want advance notice before a planned Beta Data Reset, so that I can export data I own.
50. As a user, I want a warning that Web/PWA cannot guarantee screenshot prevention, so that I can make an informed sharing decision.
51. As a Viewer, I want shared financial screens watermarked and obscured when the app backgrounds where supported, so that casual disclosure is discouraged.
52. As a user, I want to request Account Deletion only after confirming its consequences, so that destructive action is deliberate.
53. As a user who requested deletion, I want access and sharing disabled immediately, so that pending data is not still exposed.
54. As a user in Pending Deletion, I want 30 days to recover through the same Google Account, so that an accidental deletion can be reversed.
55. As a user in Pending Deletion, I want financial routes blocked until recovery completes, so that the deletion state is enforced consistently.
56. As a user whose recovery period ended, I want my account, owned Wallets, financial data, Sessions, Memberships, and Invitations deleted consistently, so that deletion is complete.
57. As a developer, I want one documented command surface from the repository root, so that format, lint, typecheck, tests, and builds are repeatable.
58. As a developer, I want local development to proxy `/api` to Express, so that cookie and routing behavior resembles production.
59. As an operator, I want validated environment configuration and fail-fast startup, so that a deployment with missing security settings cannot start silently.
60. As an operator, I want health and readiness endpoints that reveal no secrets, so that the service can be monitored safely.
61. As an operator, I want durable retryable email and deletion jobs, so that infrastructure failures do not undo successful user actions or lose required work.
62. As an operator, I want structured logs without tokens, cookies, or financial details, so that incidents can be diagnosed without creating another data leak.

## Implementation Decisions

- ใช้ npm workspaces และแยก deployable applications เป็น React web และ Express API โดยมี package กลางเฉพาะ schema/type ของ HTTP contract
- คง Feature-based Architecture ทั้งฝั่ง web และ API; frontend ห้าม import domain service, database model หรือ internal module ของ API และ API ต้อง map database model เป็น response contract
- ใช้ Express 5 กับ TypeScript strict โดยแยก application composition ที่ไม่เปิด port ออกจาก process startup เพื่อให้ทดสอบ HTTP application ได้โดยตรง
- API module แบ่งตาม auth, users, wallets, transactions, savings, sharing และ account deletion แต่สร้าง controller/service/repository/schema เฉพาะเมื่อมีหน้าที่จริง
- ตรวจ input ทุก request ที่ API boundary และใช้ response/error shape ที่สม่ำเสมอ; production error ไม่เปิด stack trace หรือรายละเอียดฐานข้อมูล
- ใช้ PostgreSQL กับ Prisma โดย migration เป็น source of truth และ workflow ที่เปลี่ยนหลายตารางต้องอยู่ใน database transaction
- ใช้ Google OpenID Connect และระบุ Auth Account ด้วย Google `sub`; email ใช้จับคู่ Beta Allowlist และ Wallet Invitation เท่านั้น ไม่ใช้เป็น identity หลัก
- ไม่จัดเก็บ Google access token หรือ refresh token เมื่อไม่จำเป็นต่อข้อมูลระบุตัวตนพื้นฐาน
- ใช้ server-side Session ผ่าน cookie แบบ `HttpOnly`, `Secure` ใน beta/production และกำหนด `SameSite` ตาม same-origin topology; request ที่เปลี่ยน state ต้องป้องกัน CSRF
- Session ใช้ rolling inactivity timeout เจ็ดวัน, รองรับการ revoke รายอุปกรณ์และทุกอุปกรณ์ และ safe return path ต้องเป็นเส้นทางภายในเท่านั้น
- ข้อมูลการเงินทุกหน้าคือ Protected Route; authentication ระบุ User และ use case ตรวจ Wallet Membership กับ role ทุก request
- Wallet มี Owner เดียวและรุ่นแรกไม่มี ownership transfer; schema/API รองรับหลาย Wallet ต่อ User แม้ UI รุ่นแรกเน้น Personal Wallet หลักหนึ่งใบ
- Wallet Membership มี role `owner` หรือ `viewer`; Viewer อ่านข้อมูลล่าสุดทั้งหมดที่ได้รับสิทธิ์แต่สร้าง แก้ไข ลบ และ export ไม่ได้
- Wallet Invitation ระบุ normalized email, หมดอายุเจ็ดวัน, มี random single-use token และ persist เฉพาะ token hash; การ accept ต้องตรวจ Google verified email และผูก Membership กับ `userId`
- การ revoke หรือ leave Membership มีผลทันทีต่อ authorization; `lastViewedAt` เก็บเพียงค่าล่าสุดและ update แบบ throttle/coalesce
- รองรับ THB เท่านั้น เงินใน persistence, API และการคำนวณเป็น integer satang; presentation layer รับผิดชอบ format เป็นบาท
- Wallet Timezone รุ่นแรกเป็น `Asia/Bangkok`; timestamps จัดเก็บเป็น UTC ขณะที่ Transaction มี `occurredOn` บังคับและ `occurredTime` ที่ nullable สำหรับการแสดงและจัดกลุ่มรายงาน
- การเรียง Transaction ภายในวันต้อง deterministic โดยใช้ occurred time, created time และ id ตามกฎเดียวกันทั้ง API และ UI; รายการไม่มีเวลาต้องไม่ถูกแสดงเป็นเที่ยงคืน
- Transaction มี immutable `createdAt` และ system-managed `updatedAt`; Viewer เห็นเวลาแก้ไขล่าสุดของรายการที่ยังอยู่ แต่รุ่นแรกไม่มี version history หรือ tombstone ให้ Viewer
- ย้ายข้อมูลจาก `localStorage` หลังผู้ใช้ยืนยันเท่านั้น ใช้ operation identifier/idempotency และ Import Marker เพื่อป้องกันการนำเข้าซ้ำ พร้อม validation และผลลัพธ์ระดับรายการ
- Email และงานลบถาวรใช้ durable outbox/job ที่ retry และ idempotent; ความล้มเหลวของ email ไม่ rollback workflow หลัก
- Account Deletion เริ่ม Pending Deletion 30 วัน โดย revoke Sessions, Invitations และ sharing ทันที; recovery ต้องใช้ Google Account เดิมและข้อมูลถูกลบถาวรเมื่อครบกำหนด
- Production ใช้ origin เดียว โดย web อยู่ที่ `/` และ API อยู่ใต้ `/api`; development ใช้ Vite proxy และ production กำหนด trusted proxy ให้ตรง topology จริง
- Beta environment แยก database, secrets, OAuth callback และ email config จาก production; account creation จำกัดด้วย audited Beta Allowlist และไม่สร้างข้อมูลผู้ใช้เมื่อไม่ผ่าน allowlist
- Beta Privacy Notice เก็บ `userId`, version และเวลาที่ยอมรับฝั่ง backend และบังคับยอมรับเวอร์ชันปัจจุบันก่อนเข้าถึงข้อมูลการเงิน
- Beta Data Reset ต้องมี environment guard, การแจ้งล่วงหน้า, Owner export และ backup/restore procedure; ห้ามใช้ production secrets หรือ production data ใน beta
- Web/PWA ไม่อ้างว่าสามารถป้องกัน screenshot; ใช้คำเตือน, Viewer watermark และ background obscuring เป็น Screen-capture Deterrence เท่านั้น
- ใช้ structured logging โดยห้าม log Session token, Invitation token, cookie, Money Amount หรือรายละเอียด Transaction
- repository root ต้องมีคำสั่ง format, format check, lint, typecheck, unit test, integration test และ build; CI รัน quality gates ทั้งหมดก่อน merge
- environment variables ต้อง validate ตอน startup, มีตัวอย่างชื่อ config ที่ไม่มี secret, มี health/readiness checks และ migration เป็นขั้นตอน deploy ที่ชัดเจน

## Testing Decisions

- Test ต้องยืนยัน observable behavior และ security outcome ไม่ผูกกับชื่อ hook, internal state, จำนวน component, Prisma model หรือจำนวนชั้นภายใน module
- seam หลักของ backend คือ Express application ที่ประกอบเสร็จแต่ไม่เปิด network port โดย integration test ส่ง HTTP request ผ่าน middleware/routes จริงและใช้ test database เพื่อครอบคลุม auth, Session, CSRF, validation, authorization, transaction และ response contract
- seam หลักของ web คือ App-level integration test ที่โต้ตอบผ่าน role, label และข้อความเหมือนผู้ใช้จริง ครอบคลุม Protected Route, sign-in return path, wallet switching, Owner/Viewer UI, invitation, import, consent, Session expiry และ account deletion/recovery
- ทดสอบ Google OIDC ที่ adapter boundary ด้วย provider responses ที่ควบคุมได้ โดยครอบคลุม valid identity, invalid state/nonce, unverified email, allowlist rejection และห้ามเรียก Google network จริงใน test suite ปกติ
- ทดสอบ authorization เป็น role matrix ที่ API boundary สำหรับ Owner, Viewer, non-member, revoked member, leaving member และ Pending Deletion โดยทุก mutation ของผู้ไม่มีสิทธิ์ต้องถูกปฏิเสธแม้สร้าง request โดยตรง
- ทดสอบ Wallet Invitation ตั้งแต่ create ถึง accept/cancel/expire/replay พร้อม email mismatch, concurrent acceptance และการเก็บ token hash แทน raw token
- ทดสอบ Session cookie attributes ใน environment ที่เกี่ยวข้อง, rolling expiry, revoke รายอุปกรณ์, revoke ทุกอุปกรณ์, backend logout และการปฏิเสธ external return path
- ทดสอบ pure domain rules แยกสำหรับ integer satang totals, Available Balance, Savings Progress, Wallet Timezone boundaries, nullable occurred time และ deterministic Transaction ordering
- ทดสอบ import adapter/use case ด้วยข้อมูลเดิมที่ถูกต้อง ปนข้อมูลเสีย การ retry ด้วย idempotency key เดิม ผลลัพธ์บางรายการล้มเหลว และ Import Marker โดยต้องไม่มีรายการซ้ำ
- ทดสอบ database transaction และ constraints สำหรับ Owner เดียว, Membership ซ้ำ, Invitation consumption, Account Deletion และ outbox creation รวมถึง race condition ที่มีผลต่อสิทธิ์
- ทดสอบ job/outbox ด้วย retry และ duplicate delivery เพื่อยืนยัน idempotency; ตรวจว่า email ไม่มี Money Amount หรือ Transaction detail และ email failure ไม่ย้อน workflow หลัก
- ทดสอบ Beta Privacy Notice enforcement ทั้งเวอร์ชันปัจจุบัน เวอร์ชันใหม่ การปฏิเสธ และ route ที่ยังอนุญาตเมื่อไม่ยอมรับ
- ทดสอบ beta reset และ deployment guard ในระดับ command/config โดยต้อง fail เมื่อ target เป็น production หรือ config สำคัญไม่ครบ
- ทดสอบ error response และ structured logs เพื่อยืนยันว่า production ไม่เปิด stack/database details และไม่บันทึก token, cookie หรือข้อมูลการเงิน
- ใช้ prior art จาก App-level workflow tests เดิม, pure domain tests และ storage adapter tests ของโครงการ และคง assertion เดิมสำหรับพฤติกรรม dashboard, Transactions, Savings, Theme และ accessibility ระหว่างย้าย monorepo
- accessibility tests ต้องครอบคลุม keyboard/focus, dialog confirmation, error/status announcement และ semantic distinction ระหว่าง Personal Wallet กับ Shared Wallet; Theme และ Reduced Motion ต้องไม่ทำให้ workflow ใช้งานไม่ได้
- quality gate ขั้นสุดท้ายคือ format check, lint, strict typecheck, unit tests, HTTP integration tests, web integration tests และ production build จาก repository root

## Out of Scope

- Guest Mode หรือการเข้าถึงข้อมูลการเงินโดยไม่เข้าสู่ระบบ
- ผู้ให้บริการ authentication อื่นนอกเหนือจาก Google ในรุ่นแรก แม้ data model รองรับการเพิ่มภายหลัง
- การโอน Wallet Ownership, co-owner หรือ Viewer ที่มีสิทธิ์แก้ไขบางส่วน
- UI สำหรับสร้างหรือจัดการ Wallet ส่วนตัวหลายใบ แม้ schema และ API ไม่จำกัดไว้ที่ใบเดียว
- สกุลเงินนอกเหนือจาก THB, multi-currency Wallet และอัตราแลกเปลี่ยน
- Transaction version history, audit trail รายละเอียดเดิม หรือการแสดงรายการที่ Owner ลบแล้วแก่ Viewer
- การ export โดย Viewer และการรับประกันว่าจะป้องกันการคัดลอกหรือ screenshot ได้
- Native mobile application หรือ Android wrapper เพื่อบล็อก screenshot
- Admin web UI สำหรับ Beta Allowlist
- Redis หรือ queue infrastructure เพิ่มเติมจนกว่า PostgreSQL outbox/job จะไม่เพียงพอ
- Public registration, abuse prevention สำหรับผู้ใช้ทั่วไป, quota และ capacity สำหรับ production scale
- การเลือก hosting provider, pricing plan หรือ production launch date
- การรับประกันว่าจะย้าย beta data ไป production

## Further Notes

- สเปกนี้สังเคราะห์จาก ADR เรื่อง Google Authentication/Read-only Wallet Sharing, ADR เรื่อง Express backend/monorepo, Architecture Guide และ Domain Glossary ปัจจุบัน โดย ADR ทั้งสองยังมีสถานะ “เสนอ” จึงควรเปลี่ยนเป็น “ยอมรับ” ก่อนเริ่ม implementation หากทีมเห็นชอบ
- จุดเสี่ยงสูงสุดคือ authorization หลัง revoke/leave, invitation replay/concurrency, Session/cookie/CSRF configuration, timezone boundary, integer money migration และ idempotent device import จึงต้องถูกพิสูจน์ผ่าน HTTP integration seam ก่อนขยาย UI
- `lastViewedAt` เป็นข้อมูลโดยประมาณสำหรับการรับรู้ของ Owner ไม่ใช่หลักฐานว่า Viewer อ่าน Wallet หรือ Transaction ใดแล้ว
- Beta Privacy Notice ต้องผ่านการตรวจด้านกฎหมาย/ความเป็นส่วนตัวตามบริบทการใช้งานจริงก่อนเชิญ tester แม้ implementation จะบันทึก consent ได้ครบ
- Issue tracker และ triage label configuration ยังไม่มีใน repository จึงจัดเก็บสเปกเป็นเอกสาร local ก่อน และยังไม่สามารถ publish พร้อม label `ready-for-agent` ได้
