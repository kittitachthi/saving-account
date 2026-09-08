# Review: tickets 10–12

Baseline: e4e161030c2facf4526d61ca4ddf7af9dee86967. User explicitly selected 10, 11 and 12 on 2026-09-08 and resumed the same batch after a usage limit. Root package.json and package-lock.json changes predate this batch and are excluded from its commit.

## Standards

Two dependency-boundary findings were corrected: application composition now lives under app and the decimal money helper is shared by the transaction and savings forms. A precision finding showed that converting the maximum integer-satang goal to floating baht could lose one satang on resave. Online money now stays in integer satang through presentation and uses integer decimal formatting at the display/input boundary. Reviewer rechecked and confirmed zero remaining actionable findings.

## Spec

The independent Spec review found the same maximum-goal round-trip issue. Added exact display and unchanged-save regression tests. Reviewer rechecked consent enforcement, Owner authorization, atomic balance checks, pagination/reporting and deferred-feature boundaries; zero unresolved findings.

## Validation

- Full suite: 174 passed (52 API, 122 web).
- Repository typecheck, lint and production build passed.
- Changed source files pass Prettier. Full repository format:check reports 82 existing/unrelated files (including the user's pre-existing package edits); no requested source file was among those warnings. This batch does not reformat unrelated source.
- Migration applied to local PostgreSQL and Prisma Client generated successfully.
- HTTP/PostgreSQL tests cover current and changed consent versions, CSRF, Owner/Viewer/non-member/missing membership, multiple owned Wallets, exact money, invalid dates, idempotency, concurrent spending, server summaries/pagination, shared state across Sessions and revoked Sessions.
- Web tests cover explicit consent/decline/logout, unchanged device data, save failure/retry, exact maximum-goal resave, server-based charts, refresh, consent changes and delayed-renewal rejection.
- Real headless Chrome used the actual Express API and PostgreSQL, with a temporary test account. Widths 1280/390/320 in light/dark and reduced motion verified consent, income/saving/goal persistence after reload, no horizontal overflow, no browser errors and no mobile avatar/control overlap. Screenshots and machine-readable results remain in verification-online. Only the test account and its cascading data were deleted afterward.

## Scope and operation

Financial data comes from PostgreSQL; legacy local data remains untouched pending ticket 15. Edit/delete, Viewer sharing and account deletion remain in their own tickets. The browser refreshes visible Wallet data every 30 seconds, on return/focus and on Wallet-day rollover. Wallet snapshots read all current Wallet rows within a consistent transaction for the present Private Beta scale.

Tickets 01–08 and 10–12 are complete (11/27). Ticket 09 and 13–27 remain.
