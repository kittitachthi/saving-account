# Online transaction edits and Undo

Tickets 13–14 add Owner-only mutations under `/api/wallets/:walletId/transactions/:transactionId`:

- `PATCH`: title, category, amount in integer satang, occurredOn, nullable occurredTime, expectedUpdatedAt. Transaction type and createdAt remain immutable.
- `DELETE`: operationId and expectedUpdatedAt. Returns operationId, undoUntil and serverTime after deletion succeeds.
- `POST /restore`: operationId identifying the deletion to undo.

Each request checks the session, same-origin mutation headers, current privacy acceptance and Owner membership. All money writes lock the Wallet row. Edits and restoration validate the prospective totals with BigInt; deleting income cannot leave a negative available balance. A stale version returns TRANSACTION_CHANGED and requires reopening the latest item.

Deletion immediately excludes the row from snapshots, totals, categories and pagination. Internal deletedAt/deleteOperationId fields support retry-safe deletion and a five-second server deadline; no deleted row or deletion metadata is exposed in snapshots. Retried deletion does not extend the deadline, and retried successful restoration does not apply money twice. An old Undo cannot restore a subsequent deletion. Rows remain internally stored until their Wallet is deleted; this provides no transaction history or expired-Undo recovery endpoint.

The browser presents the Undo receipt without waiting for snapshot refresh, conservatively deducts request time from the server window, and retains no Undo state across reload. A subsequent successful deletion replaces the visible Undo action. Restoration can fail if another device spent the freed balance; the UI displays that error and waits for authoritative data instead of restoring locally.

Validation includes assembled Express requests against PostgreSQL (authorization, timestamps, invalid inputs, concurrent rows/devices, precision limits, retry and exact expiry), Application workflows (edit, failures, focus, consecutive deletions, slow refresh and expiry), and real Chrome at 1280/390/320 pixels in both themes with reduced motion.
