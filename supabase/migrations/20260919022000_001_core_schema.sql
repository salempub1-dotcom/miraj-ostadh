-- Miraj Ostadh — Migration 001
-- Core identity + curriculum structure for V1

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  email text unique,
  province text,
  school_name text,
  role text not null default 'teacher' check (role in ('teacher','editor','reviewer','content_manager','admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('editor','reviewer','content_manager','admin')
  );
$$;

create or replace function public.can_edit_content()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('editor','content_manager','admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  starts_on date not null,
  ends_on date not null,
  is_current boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint academic_year_dates check (ends_on > starts_on)
);

create unique index academic_years_one_current_idx
on public.academic_years (is_current)
where is_current = true;

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_ar text not null,
  order_index integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_ar text not null,
  name_fr text,
  name_en text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.domains (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  code text,
  name_ar text not null,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (subject_id, name_ar)
);

create table public.curricula (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  grade_id uuid not null references public.grades(id) on delete restrict,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  name text not null,
  version text not null default '1.0',
  status text not null default 'draft' check (status in ('draft','in_review','approved','published','archived')),
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academic_year_id, grade_id, subject_id, version)
);

create trigger curricula_set_updated_at
before update on public.curricula
for each row execute function public.set_updated_at();

create table public.units (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references public.curricula(id) on delete cascade,
  number integer not null,
  title text not null,
  description text,
  order_index integer not null,
  status text not null default 'draft' check (status in ('draft','in_review','approved','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (curriculum_id, number),
  unique (curriculum_id, order_index)
);

create trigger units_set_updated_at
before update on public.units
for each row execute function public.set_updated_at();

create table public.weeks (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  number integer not null,
  title text,
  order_index integer not null,
  status text not null default 'draft' check (status in ('draft','in_review','approved','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_id, number),
  unique (unit_id, order_index)
);

create trigger weeks_set_updated_at
before update on public.weeks
for each row execute function public.set_updated_at();

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks(id) on delete cascade,
  domain_id uuid references public.domains(id) on delete set null,
  title text not null,
  lesson_number integer not null,
  duration_minutes integer not null default 45 check (duration_minutes > 0),
  order_index integer not null,
  status text not null default 'draft' check (status in ('draft','in_review','approved','published','archived')),
  created_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (week_id, lesson_number),
  unique (week_id, order_index)
);

create trigger lessons_set_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();

create index curricula_lookup_idx on public.curricula (academic_year_id, grade_id, subject_id);
create index units_curriculum_order_idx on public.units (curriculum_id, order_index);
create index weeks_unit_order_idx on public.weeks (unit_id, order_index);
create index lessons_week_order_idx on public.lessons (week_id, order_index);
create index lessons_domain_idx on public.lessons (domain_id);
create index domains_subject_order_idx on public.domains (subject_id, order_index);

alter table public.profiles enable row level security;
alter table public.academic_years enable row level security;
alter table public.grades enable row level security;
alter table public.subjects enable row level security;
alter table public.domains enable row level security;
alter table public.curricula enable row level security;
alter table public.units enable row level security;
alter table public.weeks enable row level security;
alter table public.lessons enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_select_admin"
on public.profiles for select
to authenticated
using (public.is_admin());

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "academic_years_read_active"
on public.academic_years for select
to authenticated
using (is_active or public.is_staff());

create policy "grades_read_active"
on public.grades for select
to authenticated
using (is_active or public.is_staff());

create policy "subjects_read_active"
on public.subjects for select
to authenticated
using (is_active or public.is_staff());

create policy "domains_read_active"
on public.domains for select
to authenticated
using (is_active or public.is_staff());

create policy "curricula_read_published"
on public.curricula for select
to authenticated
using (status = 'published' or public.is_staff());

create policy "units_read_published"
on public.units for select
to authenticated
using (
  public.is_staff()
  or (
    status = 'published'
    and exists (
      select 1 from public.curricula c
      where c.id = curriculum_id and c.status = 'published'
    )
  )
);

create policy "weeks_read_published"
on public.weeks for select
to authenticated
using (
  public.is_staff()
  or (
    status = 'published'
    and exists (
      select 1
      from public.units u
      join public.curricula c on c.id = u.curriculum_id
      where u.id = unit_id
        and u.status = 'published'
        and c.status = 'published'
    )
  )
);

create policy "lessons_read_published"
on public.lessons for select
to authenticated
using (
  public.is_staff()
  or (
    status = 'published'
    and exists (
      select 1
      from public.weeks w
      join public.units u on u.id = w.unit_id
      join public.curricula c on c.id = u.curriculum_id
      where w.id = week_id
        and w.status = 'published'
        and u.status = 'published'
        and c.status = 'published'
    )
  )
);

create policy "academic_years_edit_staff"
on public.academic_years for all
to authenticated
using (public.can_edit_content())
with check (public.can_edit_content());

create policy "grades_edit_staff"
on public.grades for all
to authenticated
using (public.can_edit_content())
with check (public.can_edit_content());

create policy "subjects_edit_staff"
on public.subjects for all
to authenticated
using (public.can_edit_content())
with check (public.can_edit_content());

create policy "domains_edit_staff"
on public.domains for all
to authenticated
using (public.can_edit_content())
with check (public.can_edit_content());

create policy "curricula_edit_staff"
on public.curricula for all
to authenticated
using (public.can_edit_content())
with check (public.can_edit_content());

create policy "units_edit_staff"
on public.units for all
to authenticated
using (public.can_edit_content())
with check (public.can_edit_content());

create policy "weeks_edit_staff"
on public.weeks for all
to authenticated
using (public.can_edit_content())
with check (public.can_edit_content());

create policy "lessons_edit_staff"
on public.lessons for all
to authenticated
using (public.can_edit_content())
with check (public.can_edit_content());
