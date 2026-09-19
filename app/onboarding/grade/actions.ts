'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getV1Curriculum } from '@/lib/v1';

export async function saveGradeAction(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const className = String(formData.get('class_name') ?? '').trim();
  const v1 = await getV1Curriculum(supabase);

  if (!v1) {
    redirect('/onboarding/grade?error=' + encodeURIComponent('لم يتم العثور على برنامج 3AP للغة العربية.'));
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
      .update({ curriculum_id: v1.curriculum.id, class_name: className || null })
      .eq('id', existing.id);

    if (error) redirect('/onboarding/grade?error=' + encodeURIComponent('تعذر حفظ المستوى والقسم.'));
  } else {
    const { error } = await supabase.from('teacher_academic_contexts').insert({
      user_id: userId,
      curriculum_id: v1.curriculum.id,
      class_name: className || null,
      is_current: true,
    });

    if (error) redirect('/onboarding/grade?error=' + encodeURIComponent('تعذر إنشاء السنة الدراسية الخاصة بك.'));
  }

  redirect('/onboarding/timetable');
}
