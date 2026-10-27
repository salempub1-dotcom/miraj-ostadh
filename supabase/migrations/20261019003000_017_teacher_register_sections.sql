-- Digital teacher register: class list and teacher-entered calendar/visits/training.
-- Dates/holidays from historical reference files are deliberately NOT seeded as official.
create table public.teacher_class_pupils (
 id uuid primary key default gen_random_uuid(),
 teacher_context_id uuid not null references public.teacher_academic_contexts(id) on delete cascade,
 order_index smallint not null check (order_index between 1 and 99),
 full_name text not null check (char_length(full_name) between 1 and 140),
 observations text check (char_length(observations) <= 1200),
 created_at timestamptz not null default now(),
 unique(teacher_context_id,order_index)
);
create table public.teacher_register_records (
 id uuid primary key default gen_random_uuid(),
 teacher_context_id uuid not null references public.teacher_academic_contexts(id) on delete cascade,
 record_type text not null check (record_type in ('holiday','occasion','inspection','training','visit')),
 event_date date,
 title text not null check (char_length(title) between 1 and 180),
 place text check (char_length(place) <= 180),
 notes text check (char_length(notes) <= 2000),
 created_at timestamptz not null default now()
);
create index teacher_register_records_context_type_idx on public.teacher_register_records(teacher_context_id,record_type,event_date);
alter table public.teacher_class_pupils enable row level security;
alter table public.teacher_register_records enable row level security;
create policy teacher_class_pupils_own on public.teacher_class_pupils for all to authenticated
 using(private.owns_teacher_context(teacher_context_id))
 with check(private.owns_teacher_context(teacher_context_id));
create policy teacher_register_records_own on public.teacher_register_records for all to authenticated
 using(private.owns_teacher_context(teacher_context_id))
 with check(private.owns_teacher_context(teacher_context_id));
revoke all on public.teacher_class_pupils, public.teacher_register_records from public,anon;
grant select,insert,update,delete on public.teacher_class_pupils, public.teacher_register_records to authenticated;
