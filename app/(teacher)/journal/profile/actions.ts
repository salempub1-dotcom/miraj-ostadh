'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireCompletedTeacherContext } from '@/lib/auth';

const fields = {
  teacher_name: 120, directorate: 150, school_name: 180,
  academic_qualification: 600, professional_qualification: 600,
  promotion_notes: 1500, inspector_visit_notes: 1500,
} as const;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
function optionalDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (!datePattern.test(raw) || Number.isNaN(Date.parse(raw+'T12:00:00Z'))
      || new Date(raw+'T12:00:00Z').toISOString().slice(0,10) !== raw)
    throw new Error('invalid date');
  return raw;
}
export async function saveProfessionalCard(formData: FormData) {
  const { supabase, userId } = await requireCompletedTeacherContext();
  const data: Record<string,string|null> = {};
  for (const [field,max] of Object.entries(fields)) {
    const raw = String(formData.get(field) ?? '').trim();
    if (raw.length > max) redirect('/journal/profile?error=length');
    data[field] = raw || null;
  }
  try {
    data.appointment_date = optionalDate(formData.get('appointment_date'));
    data.first_employment_date = optionalDate(formData.get('first_employment_date'));
  } catch { redirect('/journal/profile?error=date'); }
  const { error } = await supabase.from('teacher_professional_cards')
    .upsert({user_id:userId,...data,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if (error) redirect('/journal/profile?error=save');
  revalidatePath('/journal/profile');
  revalidatePath('/journal');
  redirect('/journal/profile?saved=1');
}
