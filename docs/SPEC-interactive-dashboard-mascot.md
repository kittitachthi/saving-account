# Interactive Dashboard Mascot

## Problem Statement

หน้า Dashboard เป็นพื้นที่ที่ผู้ใช้ทำกิจกรรมหลักของ Pocka แต่ยังไม่ถ่ายทอดบุคลิกที่สดใสและเป็นมิตรเหมือนหน้า Marketing สัญลักษณ์ `฿` ขนาดใหญ่ในการ์ด “ยอดเงินพร้อมใช้” ไม่มีปฏิสัมพันธ์กับการบันทึกรายการ จึงพลาดโอกาสทำให้การจดเงินสนุกและให้กำลังใจผู้ใช้

Dashboard ยังแสดงเปอร์เซ็นต์เปรียบเทียบรายเดือนที่เป็นค่าคงที่และไม่มี Source of Truth ทำให้ผู้ใช้อาจเข้าใจว่าเป็นข้อมูลจริง ขณะเดียวกัน Navigation แสดง Feature ที่ยังไม่มีหน้าปลายทางโดยไม่บอกสถานะอย่างชัดเจน

## Solution

นำมาสคอตกระเป๋าของ Pocka มาอยู่ในการ์ด “ยอดเงินพร้อมใช้” แทนสัญลักษณ์ `฿` เชิงตกแต่ง โดยให้มาสคอตตอบสนองต่อการเพิ่มรายรับ รายจ่าย และเงินเก็บที่สำเร็จ แสดงความเป็นห่วงอย่างเป็นมิตรเมื่อบันทึกไม่สำเร็จ อยู่ในสถานะ `idle` ระหว่างใช้งานปกติ และหลับเมื่อผู้ใช้ AFK ขณะหน้าเว็บมองเห็นอยู่ครบ 60 วินาที

มาสคอตมีจุดยึดหลักอยู่ในการ์ดแต่ล้นขอบได้เล็กน้อยเพื่อสร้างมิติ โดย Layout ต้องป้องกันไม่ให้ทับข้อมูล การ์ดอื่น หรือ Hit Target การเคลื่อนไหวต้องเคารพ Reduced Motion และข้อความ Feedback ต้องสื่อความหมายได้โดยไม่พึ่งภาพหรือสี

ซ่อนเปอร์เซ็นต์เปรียบเทียบทั้งสามจุดที่ยังไม่มีข้อมูลจริง และทำเมนู `รายการทั้งหมด`, `งบประมาณ` และ `รายงาน` เป็น Coming-soon Feature ที่มองเห็นได้แต่ไม่สามารถใช้งานได้

## User Stories

1. As a Pocka user, I want to see the Pocka mascot on the Dashboard, so that the application feels friendly while I manage money.
2. As a Pocka user, I want the mascot to replace the decorative currency symbol, so that the Dashboard has a distinct product identity.
3. As a Pocka user, I want the currency symbol to remain beside my Available Balance, so that the monetary unit stays unambiguous.
4. As a desktop user, I want the mascot to have enough visual space, so that it does not obscure balance information or nearby cards.
5. As a mobile user, I want the mascot to resize and reposition responsively, so that it does not crowd important content or controls.
6. As a Pocka user, I want the mascot to extend slightly beyond the balance card, so that it feels dimensional rather than trapped inside a box.
7. As a Pocka user, I want the mascot to appear calm and cheerful by default, so that the Dashboard feels welcoming without demanding attention.
8. As a user recording Income, I want the mascot to celebrate after the Income is saved successfully, so that I receive immediate positive Feedback.
9. As a user recording an Expense, I want the mascot to acknowledge it without judgment, so that tracking spending continues to feel safe and constructive.
10. As a user recording a Saving Transaction, I want the mascot to celebrate progress specially, so that saving money feels rewarding.
11. As a user whose new Transaction cannot be saved, I want the mascot to show gentle concern, so that I understand the action failed without feeling blamed.
12. As a user, I want reactions to occur only after a successful save, so that the mascot never confirms data that was not recorded.
13. As a user, I want the latest save reaction to replace an older reaction, so that Feedback always matches my most recent action.
14. As a user adding several Transactions quickly, I want reactions not to queue, so that stale animations do not continue after my work is complete.
15. As a user, I want a successful reaction to remain visible for four seconds, so that I can notice it without it becoming distracting.
16. As a user, I want the mascot to return to `idle` after a reaction, so that temporary Feedback does not look like a permanent financial status.
17. As a user who leaves the visible Dashboard inactive for 60 seconds, I want the mascot to fall asleep, so that inactivity produces a playful response.
18. As a returning user, I want any pointer, touch, keyboard, or scroll Activity to wake the mascot immediately, so that the interface responds naturally to my return.
19. As a user switching browser tabs, I want AFK timing paused while Pocka is hidden, so that I do not see a meaningless sleep transition when I return.
20. As a user returning to a previously hidden Pocka tab, I want the AFK timer to restart, so that hidden time is not treated as visible inactivity.
21. As a privacy-conscious user, I want Mascot State to remain temporary UI state, so that unnecessary behavioral data is not persisted.
22. As a user refreshing the Dashboard, I want the mascot to start in `idle`, so that stale reactions are not restored.
23. As a user who prefers reduced motion, I want the same state and message Feedback without jumping or repeated movement, so that I can use Pocka comfortably.
24. As a screen-reader user, I want meaningful Feedback available as text, so that I do not have to infer state from an illustration or color.
25. As a user recording an Expense, I want neutral colors, expressions, and language, so that Pocka supports the healthy act of tracking rather than shaming spending.
26. As a user, I want the mascot not to react to deletion, theme changes, or opening surfaces, so that its reactions keep a consistent financial meaning.
27. As a user, I want calculated monthly Income and Expense totals to remain visible, so that I retain useful financial information.
28. As a user, I do not want to see fabricated monthly comparison percentages, so that I can trust every statistic on the Dashboard.
29. As a user, I want unavailable Navigation items to remain visible, so that I can understand Pocka's planned product direction.
30. As a user, I want unavailable Navigation items labeled `เร็ว ๆ นี้`, so that I do not mistake them for broken controls.
31. As a keyboard user, I want unavailable Navigation items excluded from the Tab Order, so that I do not spend time focusing controls that cannot act.
32. As a screen-reader user, I want unavailable Navigation items identified as disabled, so that their status is communicated programmatically.
33. As a mobile user, I want Coming-soon status visible without hover, so that feature availability is understandable on touch devices.
34. As a maintainer, I want Mascot State orchestration separated from financial Domain Data, so that presentation behavior cannot alter balances or Transactions.
35. As a maintainer, I want timers and Activity listeners cleaned up when the Dashboard unmounts, so that navigation and tests do not leak background work.

## Implementation Decisions

- Implement the behavior inside the Web application; no database schema, API contract, or backend persistence changes are required.
- Treat Mascot State as a closed UI state model with `idle`, `income`, `expense`, `saving`, `sleeping`, and `error`.
- Use this priority when states compete: `error`, then the latest successful Transaction reaction, then `sleeping`, then `idle`.
- Initialize Mascot State as `idle` on every Dashboard mount or page refresh.
- Trigger `income`, `expense`, or `saving` only from the observable success boundary of creating the corresponding Transaction. Selecting a Transaction type or submitting a form before persistence succeeds must not trigger a success reaction.
- Trigger `error` only when creating Income, Expense, or a Saving Transaction fails. Existing error presentation may remain the authoritative detailed error; the mascot adds the agreed gentle Feedback and must not replace actionable error information.
- Display successful reaction states for four seconds, then return to `idle`.
- When a new result arrives before the current reaction ends, replace the state immediately, cancel the previous timer, and begin a fresh four-second timer. Do not queue reactions.
- Do not change Mascot State for editing or deleting Transactions, deleting savings, changing Theme, or opening and closing UI surfaces.
- Detect User Activity from pointer, touch, keyboard, and scroll events while the document is visible. Activity resets the 60-second AFK timer.
- Enter `sleeping` only after 60 continuous seconds without User Activity while the document is visible.
- On document hide, cancel the active AFK timer. On document visibility restoration, return to or retain `idle` as appropriate and start a new 60-second interval; hidden time does not count toward AFK.
- Any User Activity while `sleeping` returns the mascot to `idle` immediately and restarts AFK timing.
- Mascot State, reaction timers, and AFK timing remain in memory only. Do not store them in Local Storage, the database, analytics payloads, or Session state.
- Add presentation variants consistent with the existing Pocka mascot: calm smiling `idle`; joyful `income` with coins or green sparkle; friendly `expense` holding a receipt; celebratory `saving` with stars or special sparkle; `sleeping` with `Z`; and mildly concerned `error`.
- Use these initial fixed messages: `เงินเข้าแล้ว เยี่ยมเลย!`, `รับรู้แล้ว เดี๋ยวเราช่วยดูให้นะ`, `เข้าใกล้เป้าหมายอีกนิด!`, and `ยังบันทึกไม่ได้ ลองอีกครั้งนะ` for Income, Expense, Saving, and error respectively. `idle` and `sleeping` have no message.
- Preserve a non-judgmental tone. Do not use harsh facial expressions, red danger treatment, or copy that frames an Expense as failure.
- Replace only the large decorative `฿` in the balance-card rings. Keep the `฿` attached to the numeric Available Balance.
- Anchor the mascot within the right side of the Available Balance card and permit slight visual overflow beyond its top or side. Reserve layout space so overflow never covers neighboring cards, financial values, controls, or Hit Targets.
- Make the mascot presentation responsive across existing desktop and mobile Dashboard breakpoints.
- Treat mascot imagery as presentational. Text Feedback carries semantic meaning and must remain perceivable without the image or color.
- Respect `prefers-reduced-motion: reduce`: retain state imagery, expression, color, and text while removing jumping, sliding, spinning, scaling, and repeating motion.
- Keep `ภาพรวม` active and keep `ตั้งค่า` plus the Account Menu functional.
- Present `รายการทั้งหมด`, `งบประมาณ`, and `รายงาน` as Coming-soon Features with visible `เร็ว ๆ นี้` labels, reduced Visual Emphasis, no navigation, and no Side Effect.
- Expose unavailable Navigation items with `aria-disabled="true"` and exclude them from the Tab Order. Their status must be visible on both desktop and mobile without relying solely on a tooltip.
- Remove the hardcoded `8.4% จากเดือนที่แล้ว`, Income `12.5%`, and Expense `3.2%` comparisons. Preserve all totals derived from real Transaction data.
- Do not restore comparison percentages until a separate decision defines the period, calculation, empty-data behavior, and testable Source of Truth.

## Testing Decisions

- Use the rendered authenticated `App` as the primary and highest test seam. Existing App-level tests already exercise adding Income, Expense, and Saving Transactions and are the preferred prior art.
- Test external behavior through visible mascot state, Feedback text, Navigation semantics, and the absence of hardcoded comparisons. Do not assert hook names, reducer actions, timer identifiers, CSS implementation details, or internal event-listener structure.
- Use fake timers at the App seam to verify the four-second reaction lifecycle, the 60-second AFK transition, immediate wake-up, and replacement of a previous reaction by the latest result.
- Verify Income success shows Income Feedback only after the Transaction is present in the user-visible application state and returns to `idle` after four seconds.
- Verify Expense success uses the agreed non-judgmental Feedback and does not display failure or danger language.
- Verify Saving Transaction success shows the dedicated saving reaction rather than the Income or Expense reaction.
- Verify a failed create operation produces error Feedback and never briefly displays a success reaction.
- Verify two rapid successful additions show only the latest reaction and reset the four-second window rather than queueing Feedback.
- Verify pointer, touch, keyboard, and scroll Activity each reset AFK timing while the document is visible.
- Verify 60 seconds of visible inactivity enters `sleeping`, and the first User Activity returns the mascot to `idle` immediately.
- Verify hiding the document cancels AFK progress and restoring visibility starts a fresh 60-second interval, without showing a transient sleeping state caused by hidden time.
- Verify Dashboard unmount prevents pending timers from changing state or emitting test warnings.
- Verify refresh/remount begins in `idle` and no Mascot State is written to browser storage.
- Verify the Reduced Motion media preference preserves state and text Feedback while the motion-specific presentation is absent.
- Verify the large decorative currency symbol is replaced by the mascot while the numeric Available Balance retains its currency symbol.
- Verify mascot content does not cover interactive controls at representative desktop and mobile viewport sizes; prefer observable layout or browser-level assertions where the component-test DOM cannot validate geometry reliably.
- Verify `รายการทั้งหมด`, `งบประมาณ`, and `รายงาน` visibly show `เร็ว ๆ นี้`, expose disabled semantics, are outside the Tab Order, and cause no navigation or state change.
- Verify `ภาพรวม`, `ตั้งค่า`, and the Account Menu retain their existing behavior and keyboard access.
- Verify the three hardcoded comparison values and their labels are absent while Income, Expense, and Available Balance totals remain correct.
- Continue using existing App tests for regression coverage of transaction calculations, savings behavior, responsive surfaces, and authenticated application rendering.

## Out of Scope

- Reactions for editing or deleting Transactions, deleting savings, Theme changes, or opening and closing surfaces.
- Clicking, feeding, dragging, customizing, or otherwise playing directly with the mascot.
- Randomized messages, user-specific personality, streaks, rewards, or gamification persistence.
- Persisting Mascot State across refreshes, Sessions, users, or devices.
- Sending Mascot State or User Activity to backend services or analytics.
- Calculating month-over-month comparison percentages or designing their future empty-data state.
- Building pages or routes for `รายการทั้งหมด`, `งบประมาณ`, or `รายงาน`.
- Changing financial calculation rules, database schemas, authentication, or API contracts.
- Replacing the existing Marketing mascot or redesigning the Pocka brand.

## Further Notes

- ADR-013 defines the accepted state model, layout intent, motion policy, and Coming-soon Feature treatment for this work.
- The primary test seam is the authenticated App because it observes the complete flow from a user saving data to Dashboard Feedback while avoiding tests coupled to implementation structure.
- Geometry that depends on actual layout and overflow may require a small browser-level visual or end-to-end check in addition to the App seam; this should remain limited to responsive collision behavior.
- Issue tracker and triage label configuration are not present in this repository. This spec is stored locally and cannot yet be published with the `ready-for-agent` label. Run `/setup-matt-pocock-skills` before publishing it to the project issue tracker.

