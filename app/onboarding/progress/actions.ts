'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

export async function continueFromProgressAction() {
  const { supabase, userId } = await requireUser();
  const { data: context } = await supabase
    .from('teacher_academic_contexts')
    .select('id')
    .eq('user_id', userId)
    .eq('is_current', true)
    .maybeSingle();

  if (!context) redirect('/onboarding/grade');
  redirect('/onboarding/complete');
}
