import { BookOpenCheck } from 'lucide-react';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { continueFromProgressAction } from './actions';

export default async function OnboardingProgressPage() {
  const { supabase, userId } = await requireUser();
  const { data: context } = await supabase
    .from('teacher_academic_contexts')
    .select('id, curriculum_id, onboarding_completed_at')
    .eq('user_id', userId)
    .eq('is_current', true)
    .maybeSingle();

  if (!context) redirect('/onboarding/grade');
  if (context.onboarding_completed_at) redirect('/today');

  const { data: units } = await supabase.from('units').select('id').eq('curriculum_id', context.curriculum_id);
  const unitIds = (units ?? []).map((unit) => unit.id);

  let lessonCount = 0;
  if (unitIds.length) {
    const { data: weeks } = await supabase.from('weeks').select('id').in('unit_id', unitIds);
    const weekIds = (weeks ?? []).map((week) => week.id);
    if (weekIds.length) {
      const result = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .in('week_id', weekIds)
        .eq('status', 'published');
      lessonCount = result.count ?? 0;
    }
  }

  return (
    <div className="onboarding-card">
      <div className="step-line"><span className="done" /><span className="done" /><span className="done" /><span className="active" /></div>
      <span className="eyebrow">الخطوة 4 من 4</span>
      <div className="heading-with-icon">
        <div className="soft-icon"><BookOpenCheck size={26} /></div>
        <div>
          <h1>نقطة البداية في البرنامج</h1>
          <p className="muted-copy">سيستخدم معراج الأستاذ هذه النقطة لاقتراح الحصة التالية تلقائيًا.</p>
        </div>
      </div>

      {lessonCount > 0 ? (
        <div className="info-panel success-panel">
          <strong>تم العثور على {lessonCount} حصة منشورة.</strong>
          <p>سنبدأ حاليًا من أول حصة، ويمكنك تعديل نقطة تقدمك من قسم «التخطيط» بعد الدخول.</p>
        </div>
      ) : (
        <div className="info-panel">
          <strong>المحتوى الرسمي للحصص لم يُنشر بعد.</strong>
          <p>هذا لا يمنعك من إنهاء إعداد الحساب. عندما ننشر المقاطع والدروس سيظهر لك تحديد التقدم تلقائيًا.</p>
        </div>
      )}

      <form action={continueFromProgressAction}>
        <button className="primary-btn wide" type="submit">متابعة وإنهاء الإعداد</button>
      </form>
    </div>
  );
}
