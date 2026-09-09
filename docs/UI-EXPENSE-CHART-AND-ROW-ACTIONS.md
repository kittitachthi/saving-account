# Expense chart and transaction actions

User-requested corrections, 2026-09-09:

- An open transaction actions popover must stay above adjacent rows during hover, keyboard focus and reduced motion. Row and panel transforms create stacking contexts, so elevate the ancestors while their action trigger is expanded. Keep application navigation and modal layers above the panel.
- Expense chart segments and matching legend dots use red/orange shades, with separate light/dark token values. Savings and income retain their existing palettes.
- Expense percentages use exactly two decimal places in the legend, tooltip and accessible segment label (for example, 16.67%). Round presentation only; keep segment geometry, offsets and financial calculations unchanged. Rounded labels may sum to slightly more or less than 100%.

Terms: **actions popover** is the row's Edit/Delete action list; **expense share** is a category's proportion of total expenses; **stacking context** is the browser's grouping that determines which elements can paint above others.

Validation: 126 web tests, repository typecheck/lint and web build passed. Chrome checks covered 1280/390/320 widths, both themes and normal/reduced motion. Hit-testing across both action buttons verified that adjacent rows do not cover them while hovered; both actions opened their intended surfaces. Chart checks verified red/orange segment colors, two-decimal labels and unrounded geometry. Local artifacts: `.scratch/spec-backlog/verification-expense-ui/`.
