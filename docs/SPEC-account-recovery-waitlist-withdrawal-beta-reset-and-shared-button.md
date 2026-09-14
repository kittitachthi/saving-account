# Spec: Account Recovery, Waitlist Withdrawal, Beta Reset และ Shared Button

## Problem Statement

Pocka ยังไม่มีวงจรลบบัญชีที่กู้คืนได้ ช่องทางถอนคำขอ Beta Waitlist ที่ยืนยันเจ้าของ email ได้ และกระบวนการ Beta Data Reset ที่กำหนดเวลาการแจ้งเตือนกับอายุ backup ชัดเจน ขณะเดียวกันจำนวนหน้าจอและ action เพิ่มขึ้นจนปุ่มเริ่มมีรูปแบบไม่สม่ำเสมอ

## Solution

เพิ่ม Pending Deletion ที่ปิดบัญชีทันทีและกู้คืนเฉพาะ Account กับ Personal Wallet ได้ภายใน 30 วัน เพิ่มการถอน Waitlist ผ่านลิงก์ token ใช้ครั้งเดียวทาง email กำหนด Beta Reset ให้แจ้ง 14 วันและเตือนซ้ำ 3 วันก่อน reset พร้อมเก็บ encrypted backup 30 วันหลัง reset และเพิ่ม Shared Button ภายในโครงการสำหรับรูปแบบปุ่มที่ใช้ซ้ำจริง

## User Stories

1. As an authenticated user, I want to request account deletion, so that access to my financial data stops immediately.
2. As a user who declined the current Privacy Notice, I want to request account deletion, so that consent is not required to exercise deletion rights.
3. As a user requesting deletion, I want an explicit confirmation, so that I do not disable my account accidentally.
4. As a user pending deletion, I want every Session revoked, so that no existing device retains access.
5. As a user pending deletion, I want invitations and sharing disabled, so that prior relationships cannot continue exposing Wallet data.
6. As a returning user, I want to recover through the same Google Account within 30 days, so that I can restore my Account and Personal Wallet.
7. As a recovering user, I want old Sharing and Invitations to stay removed, so that recovery does not silently restore access relationships.
8. As a user beyond the recovery deadline, I want recovery rejected, so that the stated deletion lifecycle is reliable.
9. As a Waitlist applicant, I want to request withdrawal without revealing whether my email exists, so that my privacy is protected.
10. As a Waitlist applicant, I want a one-time email link, so that only someone controlling the email address can withdraw the request.
11. As a Waitlist applicant, I want an expired, replayed or malformed link rejected safely, so that a token cannot be reused.
12. As an approved beta user, I want withdrawal not to silently remove active account access, so that Waitlist withdrawal cannot become account deletion.
13. As a beta tester, I want 14 days' advance notice of a planned reset, so that I have time to export my Wallet.
14. As a beta tester, I want a reminder 3 days before reset, so that I do not miss the original notice.
15. As a Wallet Owner, I want the notice to point to Owner export, so that I can retain a personal copy.
16. As an operator, I want reset notifications deduplicated and retried, so that transient email failures do not duplicate campaign state.
17. As an operator, I want production targets rejected, so that beta tooling cannot erase production data.
18. As an operator, I want an encrypted backup before reset, so that beta data can be restored during the recovery window.
19. As an operator, I want the backup automatically deleted after 30 days, so that recovery capability has a bounded retention period.
20. As a user, I want buttons with consistent primary, secondary and destructive meaning, so that actions are predictable across Pocka.
21. As a keyboard user, I want every Shared Button to preserve focus, disabled and loading semantics, so that visual consistency does not reduce accessibility.
22. As a developer, I want a small project-owned primitive using existing Design Tokens, so that consistency improves without adopting an external UI framework.

## Implementation Decisions

- Account Deletion uses a server-owned Pending Deletion timestamp and a 30-day recovery deadline.
- Starting Pending Deletion revokes all Sessions, cancels Invitations and removes Shared Wallet Memberships atomically with the account-state transition.
- Financial and sharing routes reject Pending Deletion accounts. The deletion and recovery surfaces remain reachable without current Privacy Notice acceptance.
- Recovery requires the same Google provider subject. It restores only the Account and its Personal Wallet; removed Sharing, Viewer Memberships and Invitations are never recreated.
- Permanent deletion remains a background, retryable and idempotent operation blocked by completion of Pending Deletion recovery behavior.
- Waitlist withdrawal starts with a neutral public response regardless of whether the email is known.
- Only eligible `PENDING` or `DECLINED` entries receive an email containing a random, hashed-at-rest, single-use token with an expiry. Raw tokens are never logged and exist only in the durable email payload until delivery.
- Consuming a valid withdrawal token removes or marks the Waitlist request withdrawn atomically. Replays and expired tokens produce a neutral terminal result.
- Waitlist withdrawal does not remove `APPROVED` Allowlist access or an existing Account; those use Account Deletion.
- Planned Beta Reset creates durable notifications 14 days before execution and a deduplicated reminder 3 days before execution.
- Reset notices contain no Money Amount or Transaction details and direct Wallet Owners to the existing export workflow.
- Beta Reset always refuses production and requires an exact environment/database confirmation. Beta and production credentials remain separate.
- An encrypted backup and successful isolated restore rehearsal are required before executable reset. Backup retention is 30 days after reset, followed by verified deletion.
- Shared UI starts with one project-owned Button primitive using existing Design Tokens and no new dependency. Supported variants are only those already required: primary, secondary and destructive, plus native disabled and explicit pending presentation.
- Existing components migrate to Shared Button only when touched by this work; a repository-wide visual rewrite is out of scope.
- Component styles remain colocated CSS Modules with owner-purpose-element kebab-case classes and support Light Theme, Dark Theme, focus visibility and Reduced Motion.

## Testing Decisions

- The primary backend seam is the assembled Express application with PostgreSQL, exercising HTTP contracts, authentication, CSRF, authorization, transactions and persisted state.
- Account tests cover request, immediate revocation, Privacy Notice rejection, financial-route blocking, same-identity recovery, 30-day boundaries and concurrent delete/recover attempts.
- Waitlist tests cover neutral responses, token hashing, expiry, replay, wrong tokens, eligible statuses and the rule that approved access is unchanged.
- Reset tests cover 14-day and 3-day dedupe keys, retryable outbox delivery, Owner export messaging, production rejection, exact target confirmation and backup expiry calculation.
- App-level interaction tests cover confirmation, recovery states, withdrawal messaging and observable Shared Button states through accessible roles and names.
- Shared Button tests avoid snapshots of internal markup; consumers verify variant behavior, disabled/pending behavior and visible focus semantics.
- Existing Auth, Waitlist, notification-worker, Online Wallet and application integration tests are the prior art. Full test, typecheck, lint and production build run before completion.

## Out of Scope

- Restoring previous Wallet Sharing, Memberships or Invitations during Account recovery.
- Recovering an Account after the 30-day deadline.
- Removing approved Beta access through the Waitlist withdrawal workflow.
- An Admin web UI for account deletion, Waitlist or reset campaigns.
- A third-party component library, separate design-system package or repository-wide button migration.
- Executing a real Beta Reset or deleting a real backup during implementation tests.
- Legal approval of privacy wording or a production disaster-recovery guarantee.

## Further Notes

- The notification schedule is 14 days before reset with one reminder 3 days before reset.
- Encrypted backup retention is 30 days after reset.
- `ready-for-agent` is represented by the existing local tracker convention; no external tracker is configured.
- Account recovery, Waitlist withdrawal and reset operations must never log tokens, cookies, email addresses in full or financial details.
