# Dashboard Monthly Savings and Lively Idle Mascot

## Problem Statement

The Dashboard shows monthly Income and Expense but omits monthly Savings, so users cannot scan all three Transaction types for the current month in one place. The Daily Cashflow Comparison occupies the third summary-card position even though it describes a different, daily period. Pocka's idle pose also appears static and does not express the warm personality expected from the product.

## Solution

Show three equal summary cards in the order Income this month, Expense this month and Savings this month. Move the Daily Cashflow Comparison to a full-width row below them. All monthly cards refer to one Viewed Month, initially the current month. Replace the idle mascot artwork with Pocka sitting, hugging a coin and smiling, and add subtle leg-swing, blink and body motion while respecting Reduced Motion.

## User Stories

1. As a Wallet owner, I want to see Savings this month beside Income and Expense, so that I can understand where this month's money has gone.
2. As a Wallet owner, I want Savings to remain distinct from Expense, so that setting money aside is not presented as spending.
3. As a user, I want all three monthly cards to use the same calendar month, so that their values are directly comparable.
4. As a user, I want the cards ordered Income, Expense and Savings, so that the Dashboard follows the Transaction types I already know.
5. As a user, I want the Daily Cashflow Comparison below the monthly summary, so that daily and monthly information do not compete in one row.
6. As a desktop user, I want the Daily Cashflow Comparison to use the available row width, so that its labels, values, bar and Tooltip are easier to read.
7. As a mobile user, I want the cards to stack in a predictable order, so that I can scan Income, Expense, Savings and today's comparison without horizontal scrolling.
8. As a local-data user, I want Savings this month calculated from my saving Transactions, so that the displayed value matches my records.
9. As an Online Wallet owner, I want the server summary to include monthly Savings, so that filtering or pagination cannot change the card total.
10. As a user in Thailand, I want the current month to follow Asia/Bangkok calendar boundaries for Online Wallet data, so that Transactions near UTC month boundaries appear in the expected month.
11. As a future month-selector user, I want all monthly cards to depend on one Viewed Month concept, so that changing months later updates them together.
12. As a user with no Savings Transactions this month, I want to see a zero amount, so that absence of activity is explicit.
13. As a user, I want whole baht and satang values to retain their existing precision, so that the new card does not alter financial amounts.
14. As a user, I want the existing Available Balance and total Savings Goal chart to keep their meanings, so that monthly Savings is not confused with accumulated Savings.
15. As a user, I want Pocka's default pose to look friendly and occupied, so that the Dashboard feels welcoming before I perform an action.
16. As a user, I want Pocka to sit, hug a coin and smile while idle, so that the pose still communicates savings and money management.
17. As a user, I want subtle idle motion such as blinking, gentle body movement and a small leg swing, so that Pocka feels alive without distracting from financial data.
18. As a motion-sensitive user, I want the new idle artwork to remain cute when motion is disabled, so that no meaning depends on animation.
19. As a keyboard or screen-reader user, I want the mascot to remain presentational while status messages remain accessible, so that decorative changes do not add noise.
20. As a user, I want Income, Expense, Saving, Sleeping and Error reactions to keep their current triggers and timing, so that improving Idle does not change the mascot state model.
21. As a developer, I want Dashboard components to own matching colocated CSS Modules, so that future layout and animation changes have clear ownership.
22. As a developer, I want monthly totals to remain Derived Data from Transactions, so that the UI does not introduce another financial source of truth.

## Implementation Decisions

- Introduce **Viewed Month** as the shared calendar period used by the three monthly summary cards. This release fixes it to the current month; the model must allow a future selector without redefining each card.
- **Monthly Savings** is the sum of `saving` Transactions whose occurrence date is inside the Viewed Month. It is separate from accumulated Savings and from Expense.
- Local Dashboard calculation will return Income, Expense and Savings for the same browser-local year and month.
- Online Wallet calculation will return Income, Expense and Savings for the same Asia/Bangkok month boundary already used by the server summary.
- Extend the Wallet snapshot monthly summary with a `saving` amount. This is an additive JSON response change. HTTP paths, database schema and stored Transaction types remain unchanged.
- Display exactly three monthly cards in this order: Income this month, Expense this month, Savings this month.
- Give the Savings card its own Savings semantic color and icon treatment. Do not reuse Expense color or language.
- Place the Daily Cashflow Comparison after the three monthly cards and span the complete summary-grid row on desktop and tablet. On mobile, render it after Savings as a normal single-column card.
- Preserve Daily Cashflow semantics and interaction: it includes only Income and Expense for the current day, retains its accessible triggers and Tooltip, and does not include Savings.
- Preserve Available Balance, accumulated Savings, Savings Goal, chart categories and their existing calculations.
- Replace only the `idle` mascot visual with new transparent artwork showing Pocka seated, hugging a coin and smiling. Other reaction assets remain unchanged.
- Idle motion consists of a subtle body float/breath, occasional blink and gentle leg swing. It must not change layout, overlap financial content or accept pointer events.
- Reduced Motion shows the same seated idle illustration without repeated translation, rotation, scaling, blinking or leg movement.
- Preserve the mascot state priority, four-second feedback lifecycle, sixty-second AFK transition, visibility handling and non-persistent state established by the existing mascot decision.
- Apply current component ownership rules while changing the Dashboard: styled TSX components own same-basename CSS Modules, classes use owner-purpose-element kebab-case, and functions state their domain and operation.
- Use existing design tokens where semantic tokens exist; add a semantic token only where Savings presentation lacks one.
- No database migration is required.

## Testing Decisions

- Use the existing App/Dashboard integration seam as the main test boundary. Assert the three monthly labels, values and visible order, followed by the Daily Cashflow Comparison.
- At the integration seam, verify that adding Income, Expense and Saving Transactions updates only the appropriate monthly card and preserves Available Balance behavior.
- Extend the existing Dashboard domain tests to cover Savings, empty data, fractional amounts and Transactions inside/outside the Viewed Month.
- Extend the existing Wallet summary contract and API tests to verify monthly Savings at Asia/Bangkok month boundaries and to confirm totals remain independent of list filters and pagination.
- Reuse mascot lifecycle tests to confirm Idle remains the initial and post-feedback state and that reaction/AFK timing is unchanged. Tests should assert observable state and accessible output rather than animation implementation.
- Use a browser Visual Matrix covering desktop and mobile widths, Light and Dark themes, and normal and Reduced Motion. Verify card order, full-row Daily Cashflow layout, no overflow or overlap, idle artwork framing and stable mascot geometry.
- Verify normal-motion idle animation visually and verify Reduced Motion through computed styles. The static idle artwork must communicate the approved pose in both modes.
- Preserve existing Daily Cashflow Tooltip and keyboard interaction tests because its position changes while its behavior does not.

## Out of Scope

- A month selector, month navigation, historical-month URL state or persistence of a selected month.
- Comparing the Viewed Month with a previous month or restoring percentage-change badges.
- Changing the meaning of Available Balance, accumulated Savings, Savings Goal or Savings categories.
- Adding Savings to the Daily Cashflow Comparison.
- Changing mascot reaction messages, state priority, feedback duration, AFK duration or interaction triggers.
- Making the mascot clickable, customizable or persistent across sessions.
- Replacing mascot artwork for Income, Expense, Saving, Sleeping or Error states.
- Database schema changes.

## Further Notes

- This work is the highest-priority product task before the remaining backlog.
- The approved idle art direction is “Pocka sitting, hugging a coin, smiling and gently swinging its legs.”
- The term “this month” is the first presentation of Viewed Month. Product copy should be designed so a future selector can replace it with a selected-month label without changing financial definitions.

