import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';

export default async function HomePage() {
  const { supabase, userId } = await getAuthenticatedUser();

  if (!userId) {
    redirect('/login');
  }

  const { data: context } = await supabase
    .from('teacher_academic_contexts')
    .select('id, onboarding_completed_at')
    .eq('user_id', userId)
    .eq('is_current', true)
    .maybeSingle();

  if (!context) {
    redirect('/onboarding/profile');
  }

  if (!context.onboarding_completed_at) {
    redirect('/onboarding/timetable');
  }

  redirect('/today');
}
