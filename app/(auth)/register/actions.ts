'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/site-url';

function withError(message: string) {
  return `/register?error=${encodeURIComponent(message)}`;
}

export async function registerAction(formData: FormData) {
  const fullName = String(formData.get('full_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (fullName.length < 2) redirect(withError('أدخل الاسم واللقب.'));
  if (!email.includes('@')) redirect(withError('أدخل بريدًا إلكترونيًا صحيحًا.'));
  if (password.length < 8) redirect(withError('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل.'));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        display_name: fullName,
      },
      emailRedirectTo: `${getSiteUrl()}/onboarding/profile`,
    },
  });

  if (error) {
    redirect(withError('تعذر إنشاء الحساب. قد يكون البريد مستخدمًا من قبل أو البيانات غير صالحة.'));
  }

  if (data.session) {
    redirect('/onboarding/profile');
  }

  redirect('/check-email');
}
