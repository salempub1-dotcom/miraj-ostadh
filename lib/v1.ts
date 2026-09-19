import type { SupabaseClient } from '@supabase/supabase-js';

export const PRIMARY_GRADE_CODES = ['1AP', '2AP', '3AP', '4AP', '5AP'] as const;

export type PrimaryGradeCode = (typeof PRIMARY_GRADE_CODES)[number];

export async function getPrimaryArabicCurricula(supabase: SupabaseClient) {
  const [{ data: year }, { data: subject }, { data: grades }] = await Promise.all([
    supabase.from('academic_years').select('id, name').eq('name', '2026-2027').eq('is_active', true).maybeSingle(),
    supabase.from('subjects').select('id, code, name_ar').eq('code', 'AR').eq('is_active', true).maybeSingle(),
    supabase
      .from('grades')
      .select('id, code, name_ar, order_index')
      .in('code', [...PRIMARY_GRADE_CODES])
      .eq('is_active', true)
      .order('order_index'),
  ]);

  if (!year || !subject || !grades?.length) return null;

  const { data: curricula } = await supabase
    .from('curricula')
    .select('id, name, version, status, grade_id')
    .eq('academic_year_id', year.id)
    .eq('subject_id', subject.id)
    .eq('status', 'published');

  const curriculumByGrade = new Map((curricula ?? []).map((curriculum) => [curriculum.grade_id, curriculum]));

  const options = grades
    .map((grade) => ({
      grade,
      curriculum: curriculumByGrade.get(grade.id) ?? null,
    }))
    .filter((item) => item.curriculum);

  return { year, subject, options };
}

export async function getV1Curriculum(supabase: SupabaseClient, gradeCode: string = '3AP') {
  const primary = await getPrimaryArabicCurricula(supabase);
  if (!primary) return null;

  const selected = primary.options.find((item) => item.grade.code === gradeCode);
  if (!selected?.curriculum) return null;

  return {
    year: primary.year,
    grade: selected.grade,
    subject: primary.subject,
    curriculum: selected.curriculum,
  };
}

export async function getCurriculumContext(supabase: SupabaseClient, curriculumId: string) {
  const { data: curriculum } = await supabase
    .from('curricula')
    .select('id, name, version, grade_id, subject_id, academic_year_id')
    .eq('id', curriculumId)
    .maybeSingle();

  if (!curriculum) return null;

  const [{ data: grade }, { data: subject }, { data: year }] = await Promise.all([
    supabase.from('grades').select('id, code, name_ar').eq('id', curriculum.grade_id).maybeSingle(),
    supabase.from('subjects').select('id, code, name_ar').eq('id', curriculum.subject_id).maybeSingle(),
    supabase.from('academic_years').select('id, name').eq('id', curriculum.academic_year_id).maybeSingle(),
  ]);

  if (!grade || !subject || !year) return null;

  return { curriculum, grade, subject, year };
}
