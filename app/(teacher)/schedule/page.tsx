import TimetableViewer from '@/components/teacher/TimetableViewer';
import { requireCompletedTeacherContext } from '@/lib/auth';
import { getCurriculumContext } from '@/lib/v1';

const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export default async function SchedulePage() {
  const { supabase, context } = await requireCompletedTeacherContext();
  const [{ data: timetable }, curriculum] = await Promise.all([
    supabase.from('teacher_timetables').select('id')
      .eq('teacher_context_id', context.id).eq('is_active', true).maybeSingle(),
    getCurriculumContext(supabase, context.curriculum_id),
  ]);
  const { data: slots, error } = timetable
    ? await supabase.from('timetable_slots')
      .select('id,day_of_week,start_time,end_time,note')
      .eq('timetable_id', timetable.id)
      .order('day_of_week').order('start_time')
    : { data: [], error: null };

  const now = new Date();
  const day = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Algiers', weekday: 'short' }).format(now);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Algiers', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(now);
  if (error) return <div className="miraj-schedule-empty" role="alert">تعذر تحميل جدول استعمال الزمن. حاول إعادة فتح الصفحة.</div>;
  return <TimetableViewer
    key={context.id}
    slots={slots ?? []}
    initialDay={weekdayMap[day] ?? 0}
    currentTime={time}
    gradeName={curriculum?.grade.name_ar ?? 'الابتدائي'}
  />;
}
