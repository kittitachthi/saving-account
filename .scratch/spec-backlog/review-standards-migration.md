# Standards migration review

Fixed point: `e913bcd211b655cf4d842186426010a3b073459d`

Scope: tickets 28–31. Existing user changes to Marketing, package manifests and `googleicon.png` were excluded.

## Result

- Standards review: no remaining findings.
- Spec review: no remaining findings. Review identified an unfocused pointer-open stacking edge case; the final implementation raises both the Transaction row and panel from explicit action-menu open state.
- Transaction UI components with owned styles now use matching colocated CSS Modules and owner-purpose-element kebab-case classes.
- Web and API Transaction/Wallet functions in scope use explicit domain/operation names. HTTP paths, JSON fields and database contracts are unchanged.

## Verification

- Full tests: 184 passed (58 API, 126 web).
- Repository typecheck, lint and production build passed.
- Formatting check passed for all changed implementation and documentation files after formatting `useTransactionCollection.ts`.
- Mock browser matrix passed at 1280, 390 and 320 pixels in light/dark and normal/reduced-motion modes. Popover hit testing, red/orange expense chart, two-decimal percentages and geometry passed in all 12 combinations.
- Express/PostgreSQL browser integration passed at 1280, 390 and 320 pixels in light/dark mode. Edit, delete, Undo, reload persistence, overflow and browser-console checks passed in all 6 combinations.
