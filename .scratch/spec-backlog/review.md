# Review: selected tickets 01–05

Baseline: 77c1fbc304339d45bc7c7ed773c8ab18853be209. Two independent review agents inspected the staged implementation before commit; user-owned package changes were excluded. User's latest instruction explicitly removes the Marketing logout-success notice.

## Standards

One P3 ownership finding was raised: the balance card's paragraph selector reached into mascot feedback, which compensated with `!important`. Fixed by scoping balance selectors to their owner and giving mascot feedback its own margin and semantic color token. The Standards reviewer rechecked the final files and confirmed resolution. No actionable baseline smell findings.

## Spec

No actionable findings for tickets 01–05. Monthly totals preserve all-time Available Balance; unavailable navigation is explicitly disabled; success feedback follows persistence; failure retains data/form for retry; latest feedback replaces its timer; AFK counts only visible inactivity; cleanup and reduced motion are covered. Tickets 06–27 remain deferred. The user-authorized Marketing behavior is not scope creep.

Final findings: Standards 0 remaining (1 resolved); Spec 0. Neither axis has an outstanding issue.

## Validation

- Full suite: 121 passed, including 35 API and 86 web tests.
- Repository typecheck, lint and production build passed; changed source passes Prettier.
- Chrome: five widths (320, 390, 600, 900, 1280), light/dark, idle and saving feedback with reduced motion. No horizontal overflow or mascot collision with balance/controls; Coming-soon badges remain visible. CSS ownership correction was followed by another browser check.
- New PNG cutouts have real RGBA transparency, inspected both as assets and rendered on the dashboard. Original Marketing mascot is reused for Income; prompts and asset provenance are recorded with the assets.
- Browser screenshots and machine-readable results remain local in the verification folder. Temporary browser tooling was installed only under .scratch; project dependencies were not changed by this implementation.
