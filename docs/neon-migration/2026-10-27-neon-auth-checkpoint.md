# Neon Auth staging checkpoint — 2026-10-27

## Completed (live evidence)
- Existing Neon project `quiet-base-94226249`; **trial** branch `br-cold-grass-b4x3kbmz` / `trial-supabase-migration-20261027` only.
- Provisioned Managed Neon Auth (Better Auth) on the trial branch; `get_auth` confirmed `better_auth`; `get_neon_auth_config` confirmed branch-specific configuration.
- Branch-local `neon_auth` schema includes `user`, `session`, `account` etc. Auth user IDs and session user IDs are UUID.
- Email/password is enabled in branch config; email verification is **not required** by the current dev config. Production policy must be separately secured.
- `miraj_migration.identity_links` table created only on trial branch. Maps verified Supabase UUID to Neon UUID, plus migration verification method and app role. RLS **ENABLED and FORCED**, zero row policies, no public access grants, zero mappings. **No user accounts have been created/migrated.**
- Supabase read-only inventory: 1 auth user, 1 email identity, 1 teacher role profile, 3 teacher contexts; 0 storage objects, 0 storage buckets.
- Legacy `auth.uid()` and `private.owns_teacher_context` policies are NOT yet converted. Any app use of the current direct DB owner role would bypass protection and is **not approved**.

## Backup proof and blocker
- Existing local file `/mnt/data/miraj_supabase_backup_kit.zip` and accompanying `backup_restore.sh` were inspected; shell syntax passed.
- There is **no confirmed `pg_dump` binary or `pg_restore` binary** in this execution environment. This file is a **script kit**, NOT an encrypted archive and NOT a restore-tested source backup.
- Therefore we have **NOT** imported source users, lessons, files, or tenant data to Neon. Need trusted private backup + restore evidence before any import.
- The original Supabase project `ltcchvjxgdcdsvgrmtjb` is unchanged; no writes, no credential export.

## Required next actions
1. Run encrypted `pg_dump` from a controlled environment with direct Supabase DB access; restore to *separate* PostgreSQL instance and compare anonymized totals, FKs, Arabic content and timestamp representation.
2. Configure verified Neon Auth account recovery/new login; Supabase password hashes cannot be assumed portable. Preserve legacy ownership UUIDs using the private mapping above.
3. Implement server-side validated session → Neon UUID identity, DB role/transaction-scoped policy context, and least-privilege Postgres roles. Validate both positive and **cross-user denial** cases. Never expose DATABASE_URL or trust a client-provided role/UUID.
4. Only then import a migration snapshot into the trial Neon branch, verify row counts/FK and auth/teacher/admin routes and file access.
5. Explicit approval required before editing production Vercel env vars, merging PR or deleting Supabase.

## Actual verification performed
- Neon `get_auth`: better_auth on trial branch.
- Neon `get_neon_auth_config`: branch ID/name verified.
- Neon `information_schema.tables`: Neon Auth tables exist.
- Neon query for identity links: `rls_enabled=true`, `force_rls=true`, `active_policies=0`, `mappings=0`.
- Local `bash -n backup_restore.sh`: success.
- `pg_dump` / `pg_restore`: unavailable, no backup/restore test.
