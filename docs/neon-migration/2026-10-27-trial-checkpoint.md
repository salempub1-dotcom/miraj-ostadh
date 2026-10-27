# Migration trial checkpoint — 2026-10-27

## Identity confirmed by connected services

- Source Supabase project: `ltcchvjxgdcdsvgrmtjb` — `ACTIVE_HEALTHY` (PostgreSQL 17).
- Target Neon project: `quiet-base-94226249`, organization `org-winter-mouse-49053632`.
- Neon primary branch: `production` / `br-broad-wildflower-b44aw696` — **never modify during the trial**.
- Newly created independent Neon trial branch: `trial-supabase-migration-20261027` / `br-cold-grass-b4x3kbmz`.
- Trial branch parent: `br-broad-wildflower-b44aw696`. Branch verified `ready`.
- Trial PostgreSQL SQL connectivity confirmed: database `neondb`, PostgreSQL 18.6, `connection_ok = 1`.
- Trial database user tables: **0**.
- Pre-existing unrelated Neon branch `dev-neon-auth` was left unchanged.

## Source inventories (read-only)

- User tables in public schema: 29 (checked using information_schema).
- Foreign keys in public: 41.
- Public RLS policies: 107; all inspected public tables have RLS enabled.
- Policies with direct `auth.uid()` reference: 11.
- `auth.users` count: 1; `public.profiles` count: 1. **No user row exported.**
- `storage.buckets`: 0; `storage.objects`: 0.
- Public educational resources: 106; timetable slots: 31; teacher contexts: 3.
- Supabase migration history: 17 entries up to teacher_register_sections.

## Backup / transfer state

**NO private restore-tested backup exists yet. NO source data imported. NO Neon schema imported.** The connected Supabase API in this session can read metadata and execute SQL but exposes **no downloadable, verified pg_dump/backups API**. It is not safe to treat a SQL count report, a raw JSON export, a repository copy, or a Neon branch as the private Supabase source backup.

Before any import:
1. Produce a private encrypted `pg_dump -Fc` of the actual Supabase source using a trusted environment and PostgreSQL 17+ client, using secure credential handling, **not** the ChatGPT response or GitHub repository; separately account for Supabase Auth/Storage metadata and physical file blobs.
2. Restore into a separate disposable PostgreSQL database, verify row counts and key/FK integrity. Log only anonymized counts and validation results.
3. Inspect Supabase `auth.users` FK dependencies and `auth.uid()` policies, determine Neon Auth identity mapping and trusted session context; never copy password hashes or Supabase internal schemas.
4. Build target-compatible migrations, then import reference tables and teacher-owned rows on the **trial** branch only.
5. Verify auth, session claims, teacher isolation, file access, row counts and Arabic text.
6. Present final sync and rollback plan and obtain explicit approval before touching production.

## Operational precautions

The user has not authorized a production cutover. Do not merge this PR or change Vercel production environment variables. The Neon trial branch has compute implications under the organization's free plan; monitor project usage and delete the branch only after explicit user approval.
