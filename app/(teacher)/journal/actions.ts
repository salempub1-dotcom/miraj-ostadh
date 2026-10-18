import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireCompletedTeacherContext } from '@/lib/auth';

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
const clockPattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function saveDailyJournalAction(formData: FormData) {
  'use server';
  const { supabase } = await requireCompletedTeacherContext();
  const date = String(formData.get('date') ?? '');
  const teacherNote = String(formData.get('teacher_note') ?? '');
  const raw = String(formData.get('entries') ?? '');
  const failure = (msg: string): never =>
    redirect('/journal?date=' + encodeURIComponent(date) + '&error=' + encodeURIComponent(msg));

  if (!dayPattern.test(date) || !Number.isFinite(Date.parse(date + 'T12:00:00Z'))) {
    failure('التاريخ غير صالح.');
  }
  if (teacherNote.length > 2000 || raw.length > 130000) failure('حجم البيانات كبير جدًا.');
  let entries: Array<{ start: string; end: string; subject: string; title: string; activities: string }> = [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length > 35) failure('عدد الحصص غير صالح.');
    entries = parsed as typeof entries;
  } catch {
    failure('تعذر قراءة الحصص. أعد المحاولة.');
  }
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object' || typeof entry.start !== 'string'
      || typeof entry.end !== 'string' || !clockPattern.test(entry.start)
      || !clockPattern.test(entry.end) || entry.start >= entry.end
      || typeof entry.subject !== 'string' || !entry.subject.trim()
      || entry.subject.length > 100 || typeof entry.title !== 'string'
      || !entry.title.trim() || entry.title.length > 200
      || typeof entry.activities !== 'string' || entry.activities.length > 2500) {
      failure('تأكد من توقيت كل حصة واسم المادة وعنوان الدرس.');
    }
  }
  const { error } = await supabase.rpc('save_my_daily_journal', {
    p_date: date,
    p_teacher_note: teacherNote,
    p_entries: entries,
  });
  if (error) failure('تعذر حفظ الدفتر. لم تُغيّر أي بيانات؛ حاول مجددًا.');
  revalidatePath('/journal');
  redirect('/journal?date=' + encodeURIComponent(date) + '&saved=1');
}
