# ADR-015: Monthly Dashboard summary and Pocka idle pose

## Status

Accepted on 2026-09-09 following the user's approval of monthly Savings and the seated idle art direction.

## Context

The Dashboard places two monthly totals and one daily comparison in a single three-column row. This omits Savings from the monthly scan and mixes different calendar periods. Pocka's current standing idle artwork also feels static even with a small whole-image breathing animation.

## Decision

- Treat the current month as the initial **Viewed Month** shared by Income, Expense and Savings summary cards.
- Define **Monthly Savings** as the sum of Saving Transactions in the Viewed Month. It is neither Expense nor accumulated Savings.
- Extend the Online Wallet monthly summary with Savings using Asia/Bangkok boundaries; local data continues to use the browser calendar boundary.
- Order the monthly cards Income, Expense and Savings. Move Daily Cashflow Comparison to the next full-width row and preserve its current-day Income/Expense semantics.
- Replace the idle artwork with Pocka sitting, hugging a coin and smiling. Use subtle blink, body and leg motion in normal mode and a static version of the same pose under Reduced Motion.
- Preserve all existing mascot states, transitions, messages and timing.
- Apply component stylesheet ownership and explicit naming standards to Dashboard components changed in this work.

## Consequences

- The Wallet snapshot gains an additive monthly Savings field and all producers, consumers, fixtures and contract tests must update together.
- The monthly summary has one period model ready for future month selection without implementing that control now.
- Daily Cashflow gains more horizontal room while remaining visually after the monthly overview on every viewport.
- New idle artwork must be evaluated as a useful static pose before animation is considered, because Reduced Motion removes repeated movement.
- Dashboard style ownership migration becomes part of this feature rather than separate debt.

## Alternatives considered

- Show accumulated Savings in the third card: rejected because the other cards are monthly and a future month selector must update all three consistently.
- Include Savings in Daily Cashflow: rejected because Savings is intentionally separate from Expense and the current comparison is defined only by money entering and being spent today.
- Keep the standing image and increase whole-image movement: rejected because motion alone does not make the static pose feel more expressive and would weaken Reduced Motion quality.

