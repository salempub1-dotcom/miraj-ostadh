import type { SupabaseClient } from '@supabase/supabase-js';

export async function getV1Curriculum(supabase: SupabaseClient) {
  const [{ data: year }, { data: grade }, { data: subject }] = await Promise.all([
    supabase.from('academic_years').select('id, name').eq('name', '2026-2027').eq('is_active', true).maybeSingle(),
    supabase.from('grades').select('id, code, name_ar').eq('code', '3AP').eq('is_active', true).maybeSingle(),
    supabase.from('subjects').select('id, code, name_ar').eq('code', 'AR').eq('is_active', true).maybeSingle(),
  ]);

  if (!year || !grade || !subject) return null;

  const { data: curriculum } = await supabase
    .from('curricula')
    .select('id, name, version, status')
    .eq('academic_year_id', year.id)
    .eq('grade_id', grade.id)
    .eq('subject_id', subject.id)
    .eq('status', 'published')
    .maybeSingle();

  if (!curriculum) return null;

  return { year, grade, subject, curriculum };
}
