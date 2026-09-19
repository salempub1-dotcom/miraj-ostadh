-- Miraj Ostadh — Migration 009
-- Expand V1 scope to all five Algerian primary grades for Arabic.
-- No generated UUIDs are hardcoded; relationships are resolved through natural keys.

insert into public.grades (code, name_ar, order_index, is_active)
values
  ('1AP', 'السنة الأولى ابتدائي', 1, true),
  ('2AP', 'السنة الثانية ابتدائي', 2, true),
  ('3AP', 'السنة الثالثة ابتدائي', 3, true),
  ('4AP', 'السنة الرابعة ابتدائي', 4, true),
  ('5AP', 'السنة الخامسة ابتدائي', 5, true)
on conflict (code) do update
set name_ar = excluded.name_ar,
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
  format('اللغة العربية — %s — 2026/2027', g.name_ar),
  '1.0',
  'published',
  now()
from public.academic_years ay
join public.grades g on g.code in ('1AP', '2AP', '3AP', '4AP', '5AP')
join public.subjects s on s.code = 'AR'
where ay.name = '2026-2027'
on conflict (academic_year_id, grade_id, subject_id, version) do update
set name = excluded.name,
    status = excluded.status,
    published_at = coalesce(public.curricula.published_at, excluded.published_at),
    updated_at = now();
