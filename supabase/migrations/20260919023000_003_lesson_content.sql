-- Miraj Ostadh — Migration 003
-- Lesson content, resources, and review workflow

create or replace function private.can_review_content()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('reviewer','content_manager','admin')
  );
$$;

revoke all on function private.can_review_content() from public, anon, authenticated;
grant execute on function private.can_review_content() to authenticated;

create table public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references public.lessons(id) on delete cascade,
  terminal_competency text,
  competency_component text,
  performance_indicators text,
  learning_objectives text,
  teaching_materials text,
  version text not null default '1.0',
  status text not null default 'draft' check (status in ('draft','in_review','approved','published','archived')),
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger lesson_plans_set_updated_at
before update on public.lesson_plans
for each row execute function private.set_updated_at();

create table public.lesson_plan_stages (
  id uuid primary key default gen_random_uuid(),
  lesson_plan_id uuid not null references public.lesson_plans(id) on delete cascade,
  title text not null,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  teacher_actions text,
  learner_actions text,
  instructions text,
  assessment_notes text,
  order_index integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_plan_id, order_index)
);

create trigger lesson_plan_stages_set_updated_at
before update on public.lesson_plan_stages
for each row execute function private.set_updated_at();

create table public.lesson_texts (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text,
  body text not null,
  vocabulary_notes text,
  teacher_notes text,
  source_text text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, order_index)
);

create trigger lesson_texts_set_updated_at
before update on public.lesson_texts
for each row execute function private.set_updated_at();

create table public.lesson_activities (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  instructions text,
  content text,
  activity_type text,
  answer_key text,
  difficulty text check (difficulty is null or difficulty in ('easy','medium','advanced')),
  is_printable boolean not null default true,
  order_index integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, order_index)
);

create trigger lesson_activities_set_updated_at
before update on public.lesson_activities
for each row execute function private.set_updated_at();

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  instructions text,
  content text,
  answer_key text,
  assessment_type text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, order_index)
);

create trigger assessments_set_updated_at
before update on public.assessments
for each row execute function private.set_updated_at();

create table public.remediation_activities (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  target_skill text,
  instructions text,
  content text,
  difficulty text check (difficulty is null or difficulty in ('easy','medium','advanced')),
  answer_key text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, order_index)
);

create trigger remediation_activities_set_updated_at
before update on public.remediation_activities
for each row execute function private.set_updated_at();

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  resource_type text not null check (resource_type in ('pdf','image','worksheet','flashcard','poster','audio','document','other')),
  storage_bucket text not null,
  storage_path text not null,
  thumbnail_path text,
  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  is_downloadable boolean not null default true,
  is_printable boolean not null default true,
  status text not null default 'draft' check (status in ('draft','in_review','approved','published','archived')),
  created_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create trigger resources_set_updated_at
before update on public.resources
for each row execute function private.set_updated_at();

create table public.lesson_resources (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  category text,
  order_index integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (lesson_id, resource_id)
);

create table public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('lesson','lesson_plan','resource','activity','assessment','remediation')),
  content_id uuid not null,
  submitted_by uuid references public.profiles(id) on delete set null,
  reviewer_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','changes_requested')),
  review_comment text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index lesson_plans_lesson_idx on public.lesson_plans (lesson_id);
create index lesson_plans_created_by_idx on public.lesson_plans (created_by);
create index lesson_plan_stages_plan_order_idx on public.lesson_plan_stages (lesson_plan_id, order_index);
create index lesson_texts_lesson_order_idx on public.lesson_texts (lesson_id, order_index);
create index lesson_activities_lesson_order_idx on public.lesson_activities (lesson_id, order_index);
create index assessments_lesson_order_idx on public.assessments (lesson_id, order_index);
create index remediation_lesson_order_idx on public.remediation_activities (lesson_id, order_index);
create index resources_created_by_idx on public.resources (created_by);
create index resources_status_type_idx on public.resources (status, resource_type);
create index lesson_resources_resource_idx on public.lesson_resources (resource_id);
create index content_reviews_status_idx on public.content_reviews (status, submitted_at);
create index content_reviews_submitted_by_idx on public.content_reviews (submitted_by);
create index content_reviews_reviewer_idx on public.content_reviews (reviewer_id);

alter table public.lesson_plans enable row level security;
alter table public.lesson_plan_stages enable row level security;
alter table public.lesson_texts enable row level security;
alter table public.lesson_activities enable row level security;
alter table public.assessments enable row level security;
alter table public.remediation_activities enable row level security;
alter table public.resources enable row level security;
alter table public.lesson_resources enable row level security;
alter table public.content_reviews enable row level security;

create policy "lesson_plans_read"
on public.lesson_plans for select
to authenticated
using (
  private.is_staff()
  or (
    status = 'published'
    and exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published')
  )
);

create policy "lesson_plan_stages_read"
on public.lesson_plan_stages for select
to authenticated
using (
  private.is_staff()
  or exists (
    select 1
    from public.lesson_plans lp
    join public.lessons l on l.id = lp.lesson_id
    where lp.id = lesson_plan_id
      and lp.status = 'published'
      and l.status = 'published'
  )
);

create policy "lesson_texts_read"
on public.lesson_texts for select
to authenticated
using (private.is_staff() or exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published'));

create policy "lesson_activities_read"
on public.lesson_activities for select
to authenticated
using (private.is_staff() or exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published'));

create policy "assessments_read"
on public.assessments for select
to authenticated
using (private.is_staff() or exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published'));

create policy "remediation_activities_read"
on public.remediation_activities for select
to authenticated
using (private.is_staff() or exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published'));

create policy "resources_read"
on public.resources for select
to authenticated
using (status = 'published' or private.is_staff());

create policy "lesson_resources_read"
on public.lesson_resources for select
to authenticated
using (
  private.is_staff()
  or (
    exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published')
    and exists (select 1 from public.resources r where r.id = resource_id and r.status = 'published')
  )
);

create policy "content_reviews_read_staff"
on public.content_reviews for select
to authenticated
using (private.is_staff());

create policy "content_reviews_insert_staff"
on public.content_reviews for insert
to authenticated
with check (private.is_staff() and (submitted_by is null or submitted_by = (select auth.uid())));

create policy "content_reviews_update_staff"
on public.content_reviews for update
to authenticated
using (private.can_review_content() or submitted_by = (select auth.uid()))
with check (private.can_review_content() or submitted_by = (select auth.uid()));

create policy "content_reviews_delete_reviewers"
on public.content_reviews for delete
to authenticated
using (private.can_review_content());

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'lesson_plans',
    'lesson_plan_stages',
    'lesson_texts',
    'lesson_activities',
    'assessments',
    'remediation_activities',
    'resources',
    'lesson_resources'
  ]
  loop
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (private.can_edit_content())',
      table_name || '_insert_staff', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (private.can_edit_content()) with check (private.can_edit_content())',
      table_name || '_update_staff', table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (private.can_edit_content())',
      table_name || '_delete_staff', table_name
    );
  end loop;
end;
$$;
