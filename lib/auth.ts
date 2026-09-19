import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = error ? null : data?.claims;
  const userId = typeof claims?.sub === 'string' ? claims.sub : null;

  return { supabase, claims, userId };
}

export async function requireUser() {
  const auth = await getAuthenticatedUser();

  if (!auth.userId) {
    redirect('/login');
  }

  return { ...auth, userId: auth.userId };
}

export async function getCurrentTeacherContext(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('teacher_academic_contexts')
    .select('id, curriculum_id, class_name, is_current, onboarding_completed_at')
    .eq('user_id', userId)
    .eq('is_current', true)
    .maybeSingle();

  return data;
}

export async function requireCompletedTeacherContext() {
  const auth = await requireUser();
  const context = await getCurrentTeacherContext(auth.userId);

  if (!context) {
    redirect('/onboarding/profile');
  }

  if (!context.onboarding_completed_at) {
    redirect('/onboarding/timetable');
  }

  return { ...auth, context };
}
