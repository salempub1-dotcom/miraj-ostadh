-- Miraj Ostadh — Migration 006
-- Seed V1 reference data required by the first real onboarding flow.
-- No generated UUIDs are hardcoded; relationships are resolved through natural keys.

insert into public.academic_years (name, starts_on, ends_on, is_current, is_active)
values ('2026-2027', date '2026-09-01', date '2027-07-31', true, true)
on conflict (name) do update
set starts_on = excluded.starts_on,
    ends_on = excluded.ends_on,
    is_current = excluded.is_current,
    is_active = excluded.is_active;

update public.academic_years
set is_current = false
where name <> '2026-2027'
  and is_current = true;

insert into public.grades (code, name_ar, order_index, is_active)
values ('3AP', 'السنة الثالثة ابتدائي', 3, true)
on conflict (code) do update
set name_ar = excluded.name_ar,
    order_index = excluded.order_index,
    is_active = excluded.is_active;

insert into public.subjects (code, name_ar, name_fr, name_en, is_active)
values ('AR', 'اللغة العربية', 'Langue arabe', 'Arabic', true)
on conflict (code) do update
set name_ar = excluded.name_ar,
    name_fr = excluded.name_fr,
    name_en = excluded.name_en,
    is_active = excluded.is_active;

with arabic_subject as (
  select id from public.subjects where code = 'AR'
)
insert into public.domains (subject_id, code, name_ar, order_index, is_active)
select arabic_subject.id, d.code, d.name_ar, d.order_index, true
from arabic_subject
cross join (values
  ('oral_comprehension', 'فهم المنطوق', 1),
  ('oral_expression', 'التعبير الشفوي', 2),
  ('reading', 'القراءة', 3),
  ('grammar', 'قواعد اللغة', 4),
  ('spelling', 'الإملاء', 5),
  ('written_production', 'الإنتاج الكتابي', 6),
  ('memorization', 'المحفوظات', 7),
  ('remediation', 'المعالجة', 8)
) as d(code, name_ar, order_index)
on conflict (subject_id, name_ar) do update
set code = excluded.code,
    order_index = excluded.order_index,
    is_active = excluded.is_active;

insert into public.curricula (
  academic_year_id,
  grade_id,
  subject_id,
  name,
  version,
  status,
  published_at
)
select
  ay.id,
  g.id,
  s.id,
  'اللغة العربية — السنة الثالثة ابتدائي — 2026/2027',
  '1.0',
  'published',
  now()
from public.academic_years ay
join public.grades g on g.code = '3AP'
join public.subjects s on s.code = 'AR'
where ay.name = '2026-2027'
on conflict (academic_year_id, grade_id, subject_id, version) do update
set name = excluded.name,
    status = excluded.status,
    published_at = coalesce(public.curricula.published_at, excluded.published_at),
    updated_at = now();
