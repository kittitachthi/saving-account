# Review: tickets 06–08

Baseline: 6da081b38fe500f55d3810b1fcec2e256cfe30c7. Completed 2026-09-08. Continued the existing uncommitted authentication implementation; pre-existing root package changes are excluded from this commit.

## Standards

Independent review: no actionable findings against the repository architecture, CSS ownership guidance, ADR-011 and the code-review smell baseline.

## Spec

Independent review raised one P2 verification gap: HTTP route tests used an in-memory repository while PostgreSQL tests exercised the repository separately. Added an assembled HTTP application test using the real AuthService and Prisma repository, mocking only Google. It verifies persisted session/cookie expiry, rejected CSRF requests without mutation, renewal, logout deletion and rejection after revocation. Reviewer rechecked and confirmed resolution. No unresolved findings.

Expiry/revocation explains that sign-in is needed and retains the internal return path. Successful explicit logout still returns to Marketing without a success notice, as previously requested.

## Validation

- Full suite: 148 passed (45 API, 103 web).
- Repository typecheck, lint and production build passed; changed source formatted with Prettier.
- PostgreSQL tests verify concurrent renewals never shorten expiry and renewal cannot recreate a revoked session.
- Application lifecycle tests cover visible activity, inactive/hidden tabs, throttle/retry, local expiry rechecks after another tab renews, stale responses after logout, expiry notice, safe return path and cleanup.
- This batch adds no layout or assets; no new real-browser visual check was performed.

Tickets 01–08 are complete; 09–27 remain unimplemented. The next recommended product path is 10 → 11 → 12. Ticket 09 and waitlist tickets 25–26 can proceed independently of that path.
