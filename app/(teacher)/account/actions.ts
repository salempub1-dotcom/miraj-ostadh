'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireCompletedTeacherContext } from '@/lib/auth';
import { getV1Curriculum, PRIMARY_GRADE_CODES } from '@/lib/v1';

export async function changeTeachingGradeAction(formData: FormData) {
  const { supabase, context } = await requireCompletedTeacherContext();
  const gradeCode = String(formData.get('grade_code') ?? '');
  const className = String(formData.get('class_name') ?? '').trim();
  const errorUrl = (message: string) =>
    '/account?error=' + encodeURIComponent(message) + '#change-grade';

  if (!PRIMARY_GRADE_CODES.some((code) => code === gradeCode)) {
    redirect(errorUrl('اختر مستوى دراسيًا صحيحًا.'));
  }
  if (className.length > 100) redirect(errorUrl('اسم القسم طويل جدًا.'));
  const selected = await getV1Curriculum(supabase, gradeCode);
  if (!selected) redirect(errorUrl('البرنامج الدراسي غير متاح حاليًا.'));

  // Recheck the grade against the logged-in teacher's current academic year and subject.
  const { data: currentCurriculum, error: currentError } = await supabase
    .from('curricula')
    .select('academic_year_id,subject_id').eq('id', context.curriculum_id).single();
  if (currentError || !currentCurriculum
    || currentCurriculum.academic_year_id !== selected.year.id
    || currentCurriculum.subject_id !== selected.subject.id) {
    redirect(errorUrl('لا يمكن التبديل إلى برنامج مختلف عن السنة أو المادة الحالية.'));
  }

  const { error } = await supabase.rpc('switch_my_teaching_grade', {
    p_curriculum_id: selected.curriculum.id,
    p_class_name: className || null,
  });
  if (error) redirect(errorUrl('تعذر حفظ المستوى. يرجى إعادة المحاولة.'));

  revalidatePath('/', 'layout');
  redirect('/account?updated=1');
}
