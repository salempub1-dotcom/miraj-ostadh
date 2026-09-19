'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function withError(message: string) {
  return `/login?error=${encodeURIComponent(message)}`;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect(withError('أدخل البريد الإلكتروني وكلمة المرور.'));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(withError('تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.'));
  }

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === 'string' ? claimsData.claims.sub : null;

  if (!userId) {
    redirect(withError('تعذر التحقق من جلسة الدخول. حاول مرة أخرى.'));
  }

  const { data: context } = await supabase
    .from('teacher_academic_contexts')
    .select('id, onboarding_completed_at')
    .eq('user_id', userId)
    .eq('is_current', true)
    .maybeSingle();

  if (!context) redirect('/onboarding/profile');
  if (!context.onboarding_completed_at) redirect('/onboarding/timetable');
  redirect('/today');
}
