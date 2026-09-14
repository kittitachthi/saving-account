# Beta Data Reset

## Status

Safety check only. The reset command remains unavailable until advance notice and rehearsal are complete.

## Target check

Set `BETA_RESET_TARGET=beta` and set `BETA_RESET_DATABASE` to the exact database name in `DATABASE_URL`, then run `npm run beta:reset:check --workspace @saving-account/api`. The check always refuses `NODE_ENV=production` and never changes data.

## Backup and rehearsal

Before adding reset execution:

1. Create an encrypted PostgreSQL backup using the deployment provider's native backup facility.
2. Restore it into an isolated non-production database with different credentials.
3. Run application integrity checks against the restored database.
4. Rehearse reset only against disposable test data.
5. Record the backup identifier, restore result, notification window and operator approval without recording financial data or secrets.

The executable reset must remain a separate ticket blocked by notification and a successful rehearsal.
