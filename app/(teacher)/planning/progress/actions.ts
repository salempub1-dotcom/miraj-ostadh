'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireCompletedTeacherContext } from '@/lib/auth';
import { getPlanningData } from '@/lib/planning';

function errorRedirect(message: string): never {
  redirect(`/planning/progress?error=${encodeURIComponent(message)}`);
}

export async function saveProgressPositionAction(formData: FormData) {
  const { supabase, context } = await requireCompletedTeacherContext();
  const selectedLessonId = String(formData.get('lesson_id') ?? '').trim();
  const confirmed = formData.get('confirm_reset') === 'on';

  if (!confirmed) {
    errorRedirect('أكد أولًا أنك تريد إعادة ضبط موضعك في البرنامج.');
  }

  const planning = await getPlanningData(supabase, context.id, context.curriculum_id);
  if (!planning || planning.totalLessons === 0) {
    errorRedirect('لا توجد دروس منشورة يمكن ضبط التقدم عليها حاليًا.');
  }

  const orderedLessons = planning.units.flatMap((unit) =>
    unit.weeks.flatMap((week) => week.lessons),
  );

  const now = new Date().toISOString();

  if (selectedLessonId === '__complete__') {
    const rows = orderedLessons.map((lesson) => ({
      teacher_context_id: context.id,
      lesson_id: lesson.id,
      status: 'completed',
      completion_percent: 100,
      completed_at: now,
      stopped_stage_id: null,
    }));

    const { error } = await supabase
      .from('teacher_lesson_progress')
      .upsert(rows, { onConflict: 'teacher_context_id,lesson_id' });

    if (error) errorRedirect('تعذر حفظ التقدم. حاول مرة أخرى.');
  } else {
    const selectedIndex = orderedLessons.findIndex((lesson) => lesson.id === selectedLessonId);
    if (selectedIndex < 0) {
      errorRedirect('الحصة المحددة لا تنتمي إلى البرنامج الحالي.');
    }

    const completedRows = orderedLessons.slice(0, selectedIndex).map((lesson) => ({
      teacher_context_id: context.id,
      lesson_id: lesson.id,
      status: 'completed',
      completion_percent: 100,
      completed_at: now,
      stopped_stage_id: null,
    }));

    const pendingRows = orderedLessons.slice(selectedIndex).map((lesson) => ({
      teacher_context_id: context.id,
      lesson_id: lesson.id,
      status: 'not_started',
      completion_percent: 0,
      started_at: null,
      completed_at: null,
      stopped_stage_id: null,
    }));

    if (completedRows.length) {
      const { error } = await supabase
        .from('teacher_lesson_progress')
        .upsert(completedRows, { onConflict: 'teacher_context_id,lesson_id' });
      if (error) errorRedirect('تعذر تحديث الدروس السابقة. حاول مرة أخرى.');
    }

    if (pendingRows.length) {
      const { error } = await supabase
        .from('teacher_lesson_progress')
        .upsert(pendingRows, { onConflict: 'teacher_context_id,lesson_id' });
      if (error) errorRedirect('تعذر تعيين نقطة الانطلاق الجديدة. حاول مرة أخرى.');
    }
  }

  revalidatePath('/planning');
  revalidatePath('/today');
  redirect('/planning?updated=1');
}
