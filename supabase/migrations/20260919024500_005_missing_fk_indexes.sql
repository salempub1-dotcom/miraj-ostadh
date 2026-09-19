-- Miraj Ostadh — Migration 005
-- Cover remaining foreign keys reported by Supabase performance advisor.

create index if not exists library_items_resource_idx
  on public.library_items (resource_id)
  where resource_id is not null;

create index if not exists library_items_lesson_idx
  on public.library_items (lesson_id)
  where lesson_id is not null;

create index if not exists teacher_progress_stopped_stage_idx
  on public.teacher_lesson_progress (stopped_stage_id)
  where stopped_stage_id is not null;
