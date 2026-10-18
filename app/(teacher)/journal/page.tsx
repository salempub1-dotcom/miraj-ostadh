import { requireCompletedTeacherContext } from '@/lib/auth';
import { getCurriculumContext } from '@/lib/v1';
import JournalEditor, { type JournalEntry } from './JournalEditor';

const weekdayNumbers: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const validDate = /^\d{4}-\d{2}-\d{2}$/;

function subjectFor(label: string) {
  if (label.includes('رياضيات')) return 'الرياضيات';
  if (label.includes('إسلامية')) return 'التربية الإسلامية';
  if (label.includes('بدنية')) return 'التربية البدنية';
  if (label.includes('فنية')) return 'التربية الفنية';
  return 'اللغة العربية';
}

export default async function JournalPage({ searchParams }: {
  searchParams: Promise<{date?: string; saved?: string; error?: string}>;
}) {
  const { supabase, context, userId } = await requireCompletedTeacherContext();
  const params = await searchParams;
  const currentDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Algiers', year:'numeric',month:'2-digit',day:'2-digit',
  }).format(new Date());
  const date = typeof params.date === 'string' && validDate.test(params.date)
    && !Number.isNaN(Date.parse(params.date + 'T12:00:00Z'))
    && params.date >= '2020-01-01' && params.date <= '2040-12-31'
    ? params.date : currentDate;
  const weekday = new Intl.DateTimeFormat('en-US',{
    timeZone:'Africa/Algiers',weekday:'short',
  }).format(new Date(date + 'T12:00:00Z'));
  const dayNumber = weekdayNumbers[weekday];

  const [{data:profile}, {data:timetable}, curriculum, {data:journal}] = await Promise.all([
    supabase.from('profiles').select('full_name,display_name,school_name').eq('id',userId).single(),
    supabase.from('teacher_timetables').select('id').eq('teacher_context_id',context.id).eq('is_active',true).maybeSingle(),
    getCurriculumContext(supabase,context.curriculum_id),
    supabase.from('daily_journals').select('id,teacher_note,status').eq('teacher_context_id',context.id).eq('journal_date',date).maybeSingle(),
  ]);

  const [{data:slots, error:slotError},{data:existingEntries,error:entryError}] = await Promise.all([
    timetable && dayNumber <= 4
      ? supabase.from('timetable_slots')
        .select('id,start_time,end_time,note')
        .eq('timetable_id',timetable.id).eq('day_of_week',dayNumber).order('start_time')
      : Promise.resolve({data:[],error:null}),
    journal ? supabase.from('daily_journal_entries')
      .select('id,start_time,end_time,subject_name,lesson_title,notes')
      .eq('journal_id',journal.id).order('order_index')
      : Promise.resolve({data:[],error:null}),
  ]);
  if(slotError || entryError) return <div className="miraj-journal-error" role="alert">تعذر تحميل حصص الدفتر اليومي. يرجى إعادة المحاولة.</div>;
  const initialEntries: JournalEntry[] = journal
    ? (existingEntries ?? []).map(entry=>({
      key:entry.id,start:entry.start_time.slice(0,5),end:entry.end_time.slice(0,5),
      subject:entry.subject_name,title:entry.lesson_title,activities:entry.notes??'',
    }))
    : (slots ?? []).map(slot=>({
      key:slot.id,start:slot.start_time.slice(0,5),end:slot.end_time.slice(0,5),
      subject:subjectFor(slot.note ?? ''),title:slot.note?.trim() || subjectFor(''),
      activities:'',
    }));

  return <JournalEditor key={context.id+'-'+date}
    date={date}
    gradeName={curriculum?.grade.name_ar??'التعليم الابتدائي'}
    teacherName={profile?.display_name??profile?.full_name??'الأستاذ'}
    schoolName={profile?.school_name??''}
    className={context.class_name}
    initialEntries={initialEntries}
    initialNote={journal?.teacher_note??''}
    saved={params.saved==='1'}
    error={params.error?.slice(0,200)??null}
  />;
}
