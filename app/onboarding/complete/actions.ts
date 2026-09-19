'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

export async function finishOnboardingAction() {
  const { supabase, userId } = await requireUser();

  const { data: context } = await supabase
    .from('teacher_academic_contexts')
    .select('id')
    .eq('user_id', userId)
    .eq('is_current', true)
    .maybeSingle();

  if (!context) redirect('/onboarding/grade');

  const { data: timetable } = await supabase
    .from('teacher_timetables')
    .select('id')
    .eq('teacher_context_id', context.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!timetable) redirect('/onboarding/timetable?error=' + encodeURIComponent('أكمل جدول استعمال الزمن أولًا.'));

  const { count } = await supabase
    .from('timetable_slots')
    .select('id', { count: 'exact', head: true })
    .eq('timetable_id', timetable.id);

  if (!count) redirect('/onboarding/timetable?error=' + encodeURIComponent('أضف حصة واحدة على الأقل إلى الجدول.'));

  const { error } = await supabase
    .from('teacher_academic_contexts')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', context.id);

  if (error) redirect('/onboarding/complete?error=' + encodeURIComponent('تعذر إنهاء الإعداد. حاول مرة أخرى.'));
  redirect('/today');
}
