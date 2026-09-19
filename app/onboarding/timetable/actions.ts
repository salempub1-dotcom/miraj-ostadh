'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

type SlotInput = {
  day: number;
  start: string;
  end: string;
};

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function fail(message: string): never {
  redirect('/onboarding/timetable?error=' + encodeURIComponent(message));
}

export async function saveTimetableAction(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const raw = String(formData.get('slots') ?? '[]');

  let parsed: SlotInput[] = [];
  try {
    parsed = JSON.parse(raw) as SlotInput[];
  } catch {
    fail('تعذر قراءة جدول الحصص.');
  }

  const slots = parsed
    .filter((slot) => Number.isInteger(slot.day) && slot.day >= 0 && slot.day <= 4)
    .filter((slot) => timePattern.test(slot.start) && timePattern.test(slot.end) && slot.end > slot.start)
    .slice(0, 30)
    .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));

  if (slots.length === 0) {
    fail('أضف حصة واحدة على الأقل مع توقيت صحيح.');
  }

  const duplicateKey = new Set<string>();
  for (const slot of slots) {
    const key = `${slot.day}-${slot.start}`;
    if (duplicateKey.has(key)) fail('يوجد توقيت مكرر في نفس اليوم.');
    duplicateKey.add(key);
  }

  const { data: context } = await supabase
    .from('teacher_academic_contexts')
    .select('id')
    .eq('user_id', userId)
    .eq('is_current', true)
    .maybeSingle();

  if (!context) redirect('/onboarding/grade');

  let { data: timetable } = await supabase
    .from('teacher_timetables')
    .select('id')
    .eq('teacher_context_id', context.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!timetable) {
    const created = await supabase
      .from('teacher_timetables')
      .insert({ teacher_context_id: context.id, name: 'الجدول الأسبوعي', is_active: true })
      .select('id')
      .single();

    if (created.error || !created.data) fail('تعذر إنشاء جدول استعمال الزمن.');
    timetable = created.data;
  }

  const { error: deleteError } = await supabase.from('timetable_slots').delete().eq('timetable_id', timetable.id);
  if (deleteError) fail('تعذر تحديث الحصص الحالية.');

  const { error: insertError } = await supabase.from('timetable_slots').insert(
    slots.map((slot, index) => ({
      timetable_id: timetable!.id,
      day_of_week: slot.day,
      start_time: slot.start,
      end_time: slot.end,
      order_index: index,
    })),
  );

  if (insertError) fail('تعذر حفظ جدول الحصص.');
  redirect('/onboarding/progress');
}
