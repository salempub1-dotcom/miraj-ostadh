-- Miraj Ostadh Neon AUTH staging (TRIAL BRANCH ONLY).
-- Target: quiet-base-94226249 / br-cold-grass-b4x3kbmz
-- REQUIRE: Neon Auth already provisioned on the trial branch.
-- UUIDs are mapped only after verified account recovery/login, never by matching email alone.
CREATE SCHEMA IF NOT EXISTS miraj_migration;
REVOKE ALL ON SCHEMA miraj_migration FROM PUBLIC;
CREATE TABLE IF NOT EXISTS miraj_migration.identity_links (
  legacy_supabase_user_id uuid PRIMARY KEY,
  neon_auth_user_id uuid NOT NULL UNIQUE REFERENCES neon_auth."user"(id) ON DELETE RESTRICT,
  verified_at timestamptz NOT NULL DEFAULT now(),
  verification_method text NOT NULL CHECK (verification_method IN ('verified_login','verified_email_recovery','verified_oauth')),
  application_role text NOT NULL CHECK (application_role IN ('teacher','admin'))
);
ALTER TABLE miraj_migration.identity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE miraj_migration.identity_links FORCE ROW LEVEL SECURITY;
REVOKE ALL ON miraj_migration.identity_links FROM PUBLIC;
COMMENT ON TABLE miraj_migration.identity_links IS 'Trial-only private mapping. No application access policies until JWT validation, ownership checks and cross-user tests pass.';
-- No grants to authenticated, public or anon. No entries imported here.
