-- Miraj Ostadh — Migration 007
-- Persist completion state for the first teacher onboarding flow.

alter table public.teacher_academic_contexts
add column if not exists onboarding_completed_at timestamptz;

create index if not exists teacher_context_onboarding_idx
on public.teacher_academic_contexts (user_id, is_current, onboarding_completed_at);
