'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getV1Curriculum, PRIMARY_GRADE_CODES } from '@/lib/v1';

export async function saveGradeAction(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const className = String(formData.get('class_name') ?? '').trim();
  const gradeCode = String(formData.get('grade_code') ?? '').trim();

  if (!PRIMARY_GRADE_CODES.includes(gradeCode as (typeof PRIMARY_GRADE_CODES)[number])) {
    redirect('/onboarding/grade?error=' + encodeURIComponent('اختر السنة الدراسية من السنة الأولى إلى السنة الخامسة.'));
  }

  const selected = await getV1Curriculum(supabase, gradeCode);

  if (!selected) {
    redirect('/onboarding/grade?error=' + encodeURIComponent('برنامج اللغة العربية لهذا المستوى غير متاح حاليًا.'));
  }

  const { data: existing } = await supabase
    .from('teacher_academic_contexts')
    .select('id')
    .eq('user_id', userId)
    .eq('is_current', true)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('teacher_academic_contexts')
      .update({ curriculum_id: selected.curriculum.id, class_name: className || null })
      .eq('id', existing.id);

    if (error) redirect('/onboarding/grade?error=' + encodeURIComponent('تعذر حفظ المستوى والقسم.'));
  } else {
    const { error } = await supabase.from('teacher_academic_contexts').insert({
      user_id: userId,
      curriculum_id: selected.curriculum.id,
      class_name: className || null,
      is_current: true,
    });

    if (error) redirect('/onboarding/grade?error=' + encodeURIComponent('تعذر إنشاء السنة الدراسية الخاصة بك.'));
  }

  redirect('/onboarding/timetable');
}
