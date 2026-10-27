# Miraj Ostadh: actual data transfer to Neon trial — 2026-10-27

## Source and destination (verified)
- Supabase source: `ltcchvjxgdcdsvgrmtjb` (PostgreSQL 17), read-only during this operation.
- Neon project: `quiet-base-94226249` (PostgreSQL 18).
- Neon **trial**: `br-cold-grass-b4x3kbmz` / `trial-supabase-migration-20261027`.
- Neon primary branch `br-broad-wildflower-b44aw696` / `production` **not touched**.
- Independent recovery **branch** (not a pg_dump / external backup): `br-winter-mud-b4s0f0hr` / `recovery-copy-trial-20261027`, cloned from the trial after transfer with no compute. Trial snapshot operation failed: `not allowed to snapshot non-root branch`.

## Completed transfer and verification
- Created 29 app-owned `public` tables on trial from source column types, nullability, defaults and PK definitions.
- Copied all 180 rows from the **29 public application tables** via backend connector calls using JSONB-to-record SQL. No credentials, passwords or auth internal tables were exported to GitHub.
- Source/target **29 of 29 table counts match**. Sum 180 vs 180.
- Canonical `md5(string_agg(to_jsonb(row)::text ORDER BY ...))` checks match for **29 of 29** tables, including Arabic text, timestamps, UUID and JSONB.
- Applied 100 CHECK / UNIQUE / FOREIGN KEY constraints from source in one transactional operation. Excluded the single FK `profiles.id → auth.users.id`, which cannot be used directly with Neon Auth. This FK must be replaced once identity migration is verified.
- Created 46 additional indexes excluding those managed by constraints.
- RLS enabled and FORCE RLS on each table with **NO application grants or policies yet**, fail-closed. Legacy Supabase's 107 policies are NOT ported.
- Neon Auth Managed Better Auth is provisioned on the trial branch and `neon_auth` schema exists; `miraj_migration.identity_links` exists but contains zero mappings with FORCE RLS and no application grants.
- Supabase source: 1 auth identity using email/password; 1 profile teacher; 0 storage buckets or objects.

## Not yet done — do not delete Supabase
- No independently stored/restore-tested encrypted `pg_dump` archive. The Neon recovery copy is inside the same provider and **not** an external backup.
- No authentication user import/verification. Password hashes cannot simply be copied into current Managed Better Auth.
- No RLS rewrite or cross-user denial/positive mutation test.
- No application server-side Neon query adapter, JWT verification, login/reg onboarding or admin test.
- No verified app preview using Neon and no production cutover.
- No delta sync/replay for updates arriving after source snapshot.
- The source Supabase Auth service must remain in place until the Neon Auth login flow and teacher ownership mapping are end-to-end tested.

## Next technical steps
1. Implement branch-specific Neon Auth server integration and an authenticated Neon query layer; never embed privileged DATABASE_URL in browser or NEXT_PUBLIC values.
2. Migrate user identity with verified recovery and map legacy UUID → Neon UUID. Protect owner-specific queries and writes with transaction-bound identity/RLS.
3. Port Supabase-owned RPC behavior and auth-based SQL functions; test teacher/admin and cross-user isolation, and resource links.
4. Verify app on isolated Vercel Preview with branch-specific credentials and strict protection.
5. Create a **private independent backup** and restore-test it. Repeat source/target data comparison before final cutover.
6. Only after successful migration, change production connections with owner's approval; delete Supabase only after it no longer serves any app request and an independent backup exists.

**This checkpoint records a real application-table data copy, not a completed service migration.**
