'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

export async function saveProfileAction(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const displayName = String(formData.get('display_name') ?? '').trim();
  const province = String(formData.get('province') ?? '').trim();
  const schoolName = String(formData.get('school_name') ?? '').trim();

  if (displayName.length < 2) {
    redirect('/onboarding/profile?error=' + encodeURIComponent('أدخل الاسم الذي تريد ظهوره في المنصة.'));
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      province: province || null,
      school_name: schoolName || null,
    })
    .eq('id', userId);

  if (error) {
    redirect('/onboarding/profile?error=' + encodeURIComponent('تعذر حفظ البيانات. حاول مرة أخرى.'));
  }

  redirect('/onboarding/grade');
}
