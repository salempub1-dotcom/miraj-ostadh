import { redirect } from 'next/navigation';
import { CalendarClock } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import TimetableForm from './timetable-form';

export default async function OnboardingTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { supabase, userId } = await requireUser();
  const { error } = await searchParams;

  const { data: context } = await supabase
    .from('teacher_academic_contexts')
    .select('id, onboarding_completed_at')
    .eq('user_id', userId)
    .eq('is_current', true)
    .maybeSingle();

  if (!context) redirect('/onboarding/grade');
  if (context.onboarding_completed_at) redirect('/today');

  const { data: timetable } = await supabase
    .from('teacher_timetables')
    .select('id')
    .eq('teacher_context_id', context.id)
    .eq('is_active', true)
    .maybeSingle();

  const { data: existingSlots } = timetable
    ? await supabase
        .from('timetable_slots')
        .select('day_of_week, start_time, end_time')
        .eq('timetable_id', timetable.id)
        .order('day_of_week')
        .order('start_time')
    : { data: [] };

  const initialSlots = (existingSlots ?? []).map((slot) => ({
    day: slot.day_of_week,
    start: slot.start_time.slice(0, 5),
    end: slot.end_time.slice(0, 5),
  }));

  return (
    <div className="onboarding-card wide-onboarding-card">
      <div className="step-line"><span className="done" /><span className="done" /><span className="active" /><span /></div>
      <span className="eyebrow">الخطوة 3 من 4</span>
      <div className="heading-with-icon">
        <div className="soft-icon"><CalendarClock size={26} /></div>
        <div>
          <h1>جدول استعمال الزمن</h1>
          <p className="muted-copy">أدخل حصص اللغة العربية مرة واحدة. سنستخدمها لاحقًا في «يومي» والدفتر اليومي.</p>
        </div>
      </div>

      {error ? <div className="form-alert error">{error}</div> : null}
      <TimetableForm initialSlots={initialSlots} />
    </div>
  );
}
