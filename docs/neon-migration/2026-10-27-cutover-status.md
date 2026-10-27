# Neon cutover checkpoint (2026-10-27)

## Completed — verified
- Original Supabase project: `ltcchvjxgdcdsvgrmtjb`; no write or deletion occurred.
- Neon project: `quiet-base-94226249`; main Neon `production` branch `br-broad-wildflower-b44aw696` unchanged.
- Neon trial branch `br-cold-grass-b4x3kbmz` has all **29 public application tables** and **180 application rows** copied from Supabase.
- **29/29 row counts matched** and **29/29 full row JSONB canonical MD5 aggregates matched** at transfer time (UUIDs, Arabic content, dates).
- Trial: **107 RLS policies**, **40 foreign keys**, **19 triggers**, **46 additional indexes**, **100 source non-primary constraints**, and equivalent private helpers and 3 teacher-oriented public RPC functions migrated. One incompatible `profiles → auth.users` FK intentionally not ported.
- Trial: Neon Auth (Managed Better Auth) enabled; Neon Data API enabled and configured to use Neon Auth, with no default grants.
- Trial: a verified identity bridge function maps Neon JWT user IDs through private identity_links; unverified accounts have no mapping.
- One source email account was created in the Neon trial Auth directory, **emailVerified=false**, without a password transfer. Its old UUID/new UUID pair is stored only in `miraj_migration.pending_identity_links`. `identity_links` has zero verified entries.
- RLS denial test: `SET LOCAL ROLE authenticated` with no JWT yields 0 accessible rows for `profiles`, `teacher_academic_contexts`, `timetable_slots`; reading `identity_links` directly returns permission denied.
- Neon recovery clone from the trial (same provider, not external backup): `br-winter-mud-b4s0f0hr`; no compute.
- GitHub branch `feature/neon-cutover` adds isolated Neon Auth server handler, pilot sign-in page and JWT-authenticated Data API read page. The production Supabase login and DB code is deliberately not replaced until tested.
- Migrations under `neon/migrations/` recreate the trial schema, 107 RLS policies/functions, and 19 triggers.

## Outstanding — important blockers
1. **The Vercel connector returned HTTP 404 "Project not found"** when adding **preview-only** `NEON_AUTH_BASE_URL`, `NEON_DATA_API_URL`, and `NEON_AUTH_COOKIE_SECRET` on project `prj_rGJ2HV4AhdreOrDTEmrdVrdkWA41` under team `team_IhCrW2DUZHDJHOxFDMIGVjL6`. Values were not installed. Do not redirect or attach secrets to other projects.
2. Neon Auth login/password reset has NOT been tested end-to-end; old password hashes were not imported, and the imported account's email is not verified. A user must confirm email ownership and establish a new password. Do not promote pending mapping automatically.
3. Existing teacher/admin pages still use Supabase session and Supabase client. A Neon login test page is *not* complete app migration.
4. No separate, restore-tested encrypted `pg_dump` outside either provider. Neon recovery clone protects only against branch changes, not Neon account/provider loss.
5. No production cutover/delta replay. Neon `production`, Vercel production, GitHub main, and Supabase remain unchanged.

## Required Vercel settings (ONLY verified preview branch)
- `NEON_AUTH_BASE_URL`: trial Neon Auth URL (not a secret, but branch specific).
- `NEON_DATA_API_URL`: trial Neon Data API URL (branch specific).
- `NEON_AUTH_COOKIE_SECRET`: generate a NEW high-entropy secret inside Vercel; never commit or paste it into the chat.
- Restrict all three to **Preview / Git branch `feature/neon-cutover`**, not Production. Do not set a privileged `DATABASE_URL` in `NEXT_PUBLIC_*`.
- Neon Auth trusted origins include the preview hostname(s).

## Go/no-go checks before deletion of Supabase
- Independent encrypted backup + restore proof.
- Neon user login, reset, sign-out/session persistence.
- Identity verification and positive/negative RLS tests for teacher and admin; verify cross-user denial.
- Full app E2E routes (account, onboarding, timetable, journal, resources, files, admin).
- Source/target delta sync and hashes at cutover; preview passes.
- Explicit production release followed by observation. **Do not delete Supabase yet.**
