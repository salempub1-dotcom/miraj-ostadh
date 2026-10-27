# Neon migration — Miraj Ostadh (preflight only)

**State: BLOCKED — no Neon writes, no cutover.**

## Verified identities

- GitHub: `salempub1-dotcom/miraj-ostadh`
- Supabase source expected: `ltcchvjxgdcdsvgrmtjb` (configured in PROJECT.md, but live project authorization must still be verified)
- Neon organization: `org-winter-mouse-49053632`
- Existing Neon project: `quiet-base-94226249`
- Requested branch ID: `br-broad-wildflower-b44aw696`
- Requested branch **name**: `production`; **not yet independently confirmed to match the ID**
- Vercel team: `team_IhCrW2DUZHDJHOxFDMIGVjL6`; project: `miraj-ostadh`; production stays Supabase.

## Actual Oct 27, 2026 blockers

- `neon.ts` / `.neon` not found on GitHub main; previous CLI files were not committed.
- Neon API/MCP project inspection returned an authorization error; therefore the branch ID/name check has NOT passed.
- `npm i -g neon@latest` failed in the isolated execution runtime with `EAI_AGAIN registry.npmjs.org`. `npx neon@latest` also timed out. No CLI command was deployed.
- Supabase project API returned a permission error in this session; source database snapshot and auth/storage inventory are NOT verified.
- This branch is based on `feature/journal-integrated-home` (unmerged visual and journal features). Never rebase to or merge into main automatically.

## Hard stop gates

1. Authorized Neon client: verify organization/project AND ensure branch name `production` resolves to **exactly** `br-broad-wildflower-b44aw696`. Inspect existing neon.ts if locally present. Never initialize or deploy when this match fails.
2. Source Supabase: verify actual project identity and secure **private encrypted** backup with a successful restore test before any data copy. Never commit dumps, rows, keys or password hashes.
3. Take inventory using `docs/neon-migration/source-inventory.sql`: schemas, table row counts, FKs, policies, RLS, functions, triggers, extensions, storage buckets, auth identities (counts only), and security-definer context.
4. Choose auth strategy **before** importing FK-dependent user data. Current `lib/auth.ts` reads Supabase JWT `getClaims()` and profiles reference `auth.users`. Migrating to Neon Auth requires tested user/session transition, identity mapping, password reset or supported verified import, and equivalents for `auth.uid()`. Do NOT blindly copy `auth` or `storage` internal schemas.
5. Use a fresh disposable, isolated Neon test branch only once project ID + source branch are confirmed. Do not mutate the existing `production` branch. Test compatible schema, source data snapshot, RLS and per-user isolation there.
6. Authenticated Next.js code can use server-only Postgres (`pg` + `@vercel/functions` pool attachment on Vercel Fluid compute, subject to runtime verification). `DATABASE_URL` is server-only; NEVER `NEXT_PUBLIC_DATABASE_URL` or client SQL.
7. Keep Supabase Auth and Storage operating until replacement is demonstrably complete. Do not switch production secrets/routes.
8. Required verification: TypeScript, ESLint, Next build, actual Neon SELECT/INSERT under correct role, cross-user RLS denial, auth login, protected teacher/admin routes, real file uploads/downloads, counts/FK consistency, dates/Arabic preservation, rollback rehearsal.
9. Preview only with verified nonproduction secrets and isolated data. DO NOT point a public preview at production users or a writable live DB without explicit isolation.
10. Present written data delta-sync plan, permission tests, rollback to Supabase, and obtain explicit approval before cutover.

## Local CLI — only after branch identity is confirmed

```bash
# Run inside a trusted environment that can reach npm and Neon.
npm i -g neon@latest || true
npx neon@latest --version

# In browser, complete the login flow initiated by the CLI:
npx neon@latest login

# Inspect existing .neon and neon.ts first. Only when project, org,
# branch ID and branch name all match, and only on a private dev environment:
# npx neon@latest init -y --org-id org-winter-mouse-49053632 \
#   --project-id quiet-base-94226249 --branch production --services postgres

# Do NOT run npx neon@latest deploy until safely reviewed neon.ts
# and confirmed branch ID/name and intended migration target.
```

No .env files or connection secrets belong in this repository. If the CLI stops at **Awaiting authentication in web browser**, finish login in the browser opened by the CLI on your own device; do not paste passwords, tokens, or connection strings in chat.

## Restore and sync

- Preserve UUIDs using explicit columns when importing user-dependent tables; reconcile profile identity in the new authentication system before enabling foreign keys.
- Import reference tables then user-scoped tables in FK topological order. Never bypass RLS for app requests. DB restore tooling may use a privileged migration role only in a private migration job, then lock it down.
- Perform a baseline snapshot with source transaction watermark, delta replay with conflict checks, briefly freeze writes on the final cutover only after approval, replay final changes, reconcile counts and hashes, then point only the approved environment to Neon.
- Rollback: revert env/feature flag to Supabase, retain Supabase without data deletion, reconcile reverse deltas on any successful Neon writes before resuming production, and verify logins.

This document describes an **incomplete migration**, not an executed transfer.
