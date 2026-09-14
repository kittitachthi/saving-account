# Beta Data Reset

## Status

The safety check and local isolated rehearsal are complete. A provider-native rehearsal with separate credentials and verified automatic backup deletion remains before this readiness ticket can close. The reset command remains unavailable.

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

## Rehearsal record

Completed on 2026-09-14 using disposable local databases named `pocka_beta_rehearsal_source` and `pocka_beta_rehearsal_restore`; the application database was not used.

- Applied all 9 migrations and inserted one disposable User, Wallet, Transaction and Savings Goal.
- Created a PostgreSQL custom-format dump, encrypted it with AES-256-GCM, decrypted it and verified the local backup identifier `sha256:422A97E800CC60D10A061FF63D1F9C5348DE49C8235AF390382220ABF4FFF572`.
- Restored into the isolated database, confirmed all 9 migrations, matched the four disposable records and Money Amount, and found no orphan Transaction.
- The local run exposed an early notice date; the scheduling seam now verifies a 2030-01-04 notice, 2030-01-15 reminder and 2030-01-18 reset, exactly 14 and 3 days before reset. Backup deletion is due 2030-02-17.
- Received explicit operator approval, passed the target guard, reset only the disposable source, and confirmed 0 Users, Wallets, Transactions and Savings Goals with all 9 migrations reapplied.
- Removed the disposable databases, plaintext dumps, encryption key and encrypted rehearsal artifact after verification.

This local rehearsal used separate databases on the same PostgreSQL service with the same disposable credentials; it does not satisfy the provider-native or credential-isolation gate. Every real Beta Reset still requires advance notification, explicit operator approval, a fresh encrypted provider-native backup restored with separate non-production credentials, and verified automatic deletion after 30 days.
