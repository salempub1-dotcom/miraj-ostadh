-- Teacher-owned professional information inspired by the supplied paper daily register.
-- One private card per teacher; do not copy source PDF personal information.
create table if not exists public.teacher_professional_cards (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  teacher_name text,
  directorate text,
  school_name text,
  academic_qualification text,
  professional_qualification text,
  appointment_date date,
  first_employment_date date,
  promotion_notes text,
  inspector_visit_notes text,
  updated_at timestamptz not null default now(),
  constraint professional_card_lengths check (
    length(coalesce(teacher_name,'')) <= 120 and
    length(coalesce(directorate,'')) <= 150 and
    length(coalesce(school_name,'')) <= 180 and
    length(coalesce(academic_qualification,'')) <= 600 and
    length(coalesce(professional_qualification,'')) <= 600 and
    length(coalesce(promotion_notes,'')) <= 1500 and
    length(coalesce(inspector_visit_notes,'')) <= 1500
  )
);
alter table public.teacher_professional_cards enable row level security;
create policy professional_card_select_own on public.teacher_professional_cards
  for select to authenticated using (user_id=(select auth.uid()));
create policy professional_card_insert_own on public.teacher_professional_cards
  for insert to authenticated with check (user_id=(select auth.uid()));
create policy professional_card_update_own on public.teacher_professional_cards
  for update to authenticated using (user_id=(select auth.uid()))
  with check (user_id=(select auth.uid()));
revoke all on public.teacher_professional_cards from public,anon;
grant select,insert,update on public.teacher_professional_cards to authenticated;
