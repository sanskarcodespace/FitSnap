# Database Backups & Rollbacks

This document outlines the standard operating procedures for managing database integrity, backups, and disaster recovery.

## 1. Automated Backups (Daily)
- We rely on our managed PostgreSQL provider (e.g., AWS RDS, Supabase, Neon) for automated daily snapshots.
- Ensure Point-in-Time Recovery (PITR) is enabled for the past 7-30 days depending on the provider tier.

## 2. Pre-Deployment Check
- During major releases (involving complex Prisma migrations), take a manual database snapshot via the provider's CLI/dashboard *before* running `npm run db:deploy`.

## 3. Rollback Procedure
If a migration corrupts data or a deployment introduces severe regressions:
1. **Stop Application Traffic**: Put the application into maintenance mode or scale web instances to 0 to prevent further data mutation.
2. **Restore Snapshot**: Use the database provider's UI/CLI to restore the database to the snapshot taken before the deployment, or use PITR to restore to a timestamp exactly before the deployment.
3. **Revert Code**: Revert the `main` branch to the previous stable commit.
4. **Deploy**: Trigger a deployment of the reverted code. Since the database was restored, it will match the Prisma schema of the reverted code. (Do not run `db:deploy` on reverted code if the snapshot already matches it).
5. **Resume Traffic**: Scale web instances back up.

## 4. Prisma Migration Rollbacks
Prisma does not support automatic "down" migrations (reverting a migration via the CLI). 
- If a schema change is deployed but the data is uncorrupted, the safest approach is to create a *new* migration that reverses the changes (e.g., re-adding a dropped column) and deploy forward.
- If data is corrupted, use the full Snapshot Restore procedure above.
