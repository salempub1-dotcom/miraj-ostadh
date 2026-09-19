-- Miraj Ostadh — Migration 004
-- Teacher academic context, timetable, progress, library, and daily journal

create or replace function private.owns_teacher_context(context_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.teacher_academic_contexts tac
    where tac.id = context_id
      and tac.user_id = auth.uid()
  );
$$;

-- Tables are created before granting EXECUTE on helper functions that depend on them.

create table public.teacher_academic_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  curriculum_id uuid not null references public.curricula(id) on delete restrict,
  class_name text,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, curriculum_id, class_name)
);

create unique index teacher_context_one_current_idx
on public.teacher_academic_contexts (user_id)
where is_current = true;

create trigger teacher_contexts_set_updated_at
before update on public.teacher_academic_contexts
for each row execute function private.set_updated_at();

create table public.teacher_timetables (
  id uuid primary key default gen_random_uuid(),
  teacher_context_id uuid not null references public.teacher_academic_contexts(id) on delete cascade,
  name text not null default 'الجدول الأسبوعي',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index teacher_timetable_one_active_idx
on public.teacher_timetables (teacher_context_id)
where is_active = true;

create trigger teacher_timetables_set_updated_at
before update on public.teacher_timetables
for each row execute function private.set_updated_at();

create table public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  timetable_id uuid not null references public.teacher_timetables(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  order_index integer not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timetable_slot_time_check check (end_time > start_time),
  unique (timetable_id, day_of_week, start_time)
);

create trigger timetable_slots_set_updated_at
before update on public.timetable_slots
for each row execute function private.set_updated_at();

create table public.teacher_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  teacher_context_id uuid not null references public.teacher_academic_contexts(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed','partial','postponed','skipped')),
  started_at timestamptz,
  completed_at timestamptz,
  completion_percent smallint not null default 0 check (completion_percent between 0 and 100),
  stopped_stage_id uuid references public.lesson_plan_stages(id) on delete set null,
  teacher_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_context_id, lesson_id)
);

create trigger teacher_lesson_progress_set_updated_at
before update on public.teacher_lesson_progress
for each row execute function private.set_updated_at();

create table public.teacher_lesson_customizations (
  id uuid primary key default gen_random_uuid(),
  teacher_context_id uuid not null references public.teacher_academic_contexts(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  custom_title text,
  custom_objectives text,
  custom_materials text,
  custom_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_context_id, lesson_id)
);

create trigger teacher_lesson_customizations_set_updated_at
before update on public.teacher_lesson_customizations
for each row execute function private.set_updated_at();

create table public.library_items (
  id uuid primary key default gen_random_uuid(),
  teacher_context_id uuid not null references public.teacher_academic_contexts(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  item_type text not null check (item_type in ('resource','lesson')),
  created_at timestamptz not null default now(),
  constraint library_item_target_check check (
    (item_type = 'resource' and resource_id is not null and lesson_id is null)
    or
    (item_type = 'lesson' and lesson_id is not null and resource_id is null)
  )
);

create unique index library_unique_resource_idx
on public.library_items (teacher_context_id, resource_id)
where resource_id is not null;

create unique index library_unique_lesson_idx
on public.library_items (teacher_context_id, lesson_id)
where lesson_id is not null;

create table public.daily_journals (
  id uuid primary key default gen_random_uuid(),
  teacher_context_id uuid not null references public.teacher_academic_contexts(id) on delete cascade,
  journal_date date not null,
  status text not null default 'draft' check (status in ('draft','finalized')),
  teacher_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_context_id, journal_date)
);

create trigger daily_journals_set_updated_at
before update on public.daily_journals
for each row execute function private.set_updated_at();

create table public.daily_journal_entries (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.daily_journals(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  start_time time not null,
  end_time time not null,
  subject_name text not null,
  domain_name text,
  lesson_title text not null,
  entry_type text not null default 'normal' check (entry_type in ('normal','manual','break')),
  notes text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journal_entry_time_check check (end_time > start_time)
);

create trigger daily_journal_entries_set_updated_at
before update on public.daily_journal_entries
for each row execute function private.set_updated_at();

-- Now that the owning table exists, expose helper only to signed-in users for RLS evaluation.
revoke all on function private.owns_teacher_context(uuid) from public, anon, authenticated;
grant execute on function private.owns_teacher_context(uuid) to authenticated;

create or replace function private.owns_timetable(timetable uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.teacher_timetables tt
    join public.teacher_academic_contexts tac on tac.id = tt.teacher_context_id
    where tt.id = timetable
      and tac.user_id = auth.uid()
  );
$$;

create or replace function private.owns_journal(journal uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.daily_journals dj
    join public.teacher_academic_contexts tac on tac.id = dj.teacher_context_id
    where dj.id = journal
      and tac.user_id = auth.uid()
  );
$$;

revoke all on function private.owns_timetable(uuid) from public, anon, authenticated;
revoke all on function private.owns_journal(uuid) from public, anon, authenticated;
grant execute on function private.owns_timetable(uuid) to authenticated;
grant execute on function private.owns_journal(uuid) to authenticated;

create index teacher_context_user_idx on public.teacher_academic_contexts (user_id);
create index teacher_context_curriculum_idx on public.teacher_academic_contexts (curriculum_id);
create index teacher_timetables_context_idx on public.teacher_timetables (teacher_context_id);
create index timetable_slots_timetable_day_idx on public.timetable_slots (timetable_id, day_of_week, order_index);
create index teacher_progress_context_status_idx on public.teacher_lesson_progress (teacher_context_id, status);
create index teacher_progress_lesson_idx on public.teacher_lesson_progress (lesson_id);
create index teacher_customizations_lesson_idx on public.teacher_lesson_customizations (lesson_id);
create index library_context_idx on public.library_items (teacher_context_id, created_at desc);
create index daily_journals_context_date_idx on public.daily_journals (teacher_context_id, journal_date desc);
create index daily_journal_entries_journal_order_idx on public.daily_journal_entries (journal_id, order_index);
create index daily_journal_entries_lesson_idx on public.daily_journal_entries (lesson_id);

alter table public.teacher_academic_contexts enable row level security;
alter table public.teacher_timetables enable row level security;
alter table public.timetable_slots enable row level security;
alter table public.teacher_lesson_progress enable row level security;
alter table public.teacher_lesson_customizations enable row level security;
alter table public.library_items enable row level security;
alter table public.daily_journals enable row level security;
alter table public.daily_journal_entries enable row level security;

create policy "teacher_contexts_own_select"
on public.teacher_academic_contexts for select
to authenticated
using (user_id = (select auth.uid()));

create policy "teacher_contexts_own_insert"
on public.teacher_academic_contexts for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "teacher_contexts_own_update"
on public.teacher_academic_contexts for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "teacher_contexts_own_delete"
on public.teacher_academic_contexts for delete
to authenticated
using (user_id = (select auth.uid()));

create policy "teacher_timetables_own_select"
on public.teacher_timetables for select
to authenticated
using (private.owns_teacher_context(teacher_context_id));

create policy "teacher_timetables_own_insert"
on public.teacher_timetables for insert
to authenticated
with check (private.owns_teacher_context(teacher_context_id));

create policy "teacher_timetables_own_update"
on public.teacher_timetables for update
to authenticated
using (private.owns_teacher_context(teacher_context_id))
with check (private.owns_teacher_context(teacher_context_id));

create policy "teacher_timetables_own_delete"
on public.teacher_timetables for delete
to authenticated
using (private.owns_teacher_context(teacher_context_id));

create policy "timetable_slots_own_select"
on public.timetable_slots for select
to authenticated
using (private.owns_timetable(timetable_id));

create policy "timetable_slots_own_insert"
on public.timetable_slots for insert
to authenticated
with check (private.owns_timetable(timetable_id));

create policy "timetable_slots_own_update"
on public.timetable_slots for update
to authenticated
using (private.owns_timetable(timetable_id))
with check (private.owns_timetable(timetable_id));

create policy "timetable_slots_own_delete"
on public.timetable_slots for delete
to authenticated
using (private.owns_timetable(timetable_id));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'teacher_lesson_progress',
    'teacher_lesson_customizations',
    'library_items',
    'daily_journals'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (private.owns_teacher_context(teacher_context_id))',
      table_name || '_own_select', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (private.owns_teacher_context(teacher_context_id))',
      table_name || '_own_insert', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (private.owns_teacher_context(teacher_context_id)) with check (private.owns_teacher_context(teacher_context_id))',
      table_name || '_own_update', table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (private.owns_teacher_context(teacher_context_id))',
      table_name || '_own_delete', table_name
    );
  end loop;
end;
$$;

create policy "daily_journal_entries_own_select"
on public.daily_journal_entries for select
to authenticated
using (private.owns_journal(journal_id));

create policy "daily_journal_entries_own_insert"
on public.daily_journal_entries for insert
to authenticated
with check (private.owns_journal(journal_id));

create policy "daily_journal_entries_own_update"
on public.daily_journal_entries for update
to authenticated
using (private.owns_journal(journal_id))
with check (private.owns_journal(journal_id));

create policy "daily_journal_entries_own_delete"
on public.daily_journal_entries for delete
to authenticated
using (private.owns_journal(journal_id));
