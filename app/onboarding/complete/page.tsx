import { CheckCircle2, CalendarDays, GraduationCap, Languages } from 'lucide-react';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { finishOnboardingAction } from './actions';

export default async function OnboardingCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { supabase, userId } = await requireUser();
  const { error } = await searchParams;

  const [{ data: profile }, { data: context }] = await Promise.all([
    supabase.from('profiles').select('display_name, full_name').eq('id', userId).single(),
    supabase
      .from('teacher_academic_contexts')
      .select('id, class_name, onboarding_completed_at')
      .eq('user_id', userId)
      .eq('is_current', true)
      .maybeSingle(),
  ]);

  if (!context) redirect('/onboarding/grade');
  if (context.onboarding_completed_at) redirect('/today');

  const { data: timetable } = await supabase
    .from('teacher_timetables')
    .select('id')
    .eq('teacher_context_id', context.id)
    .eq('is_active', true)
    .maybeSingle();

  const { count: slotsCount } = timetable
    ? await supabase.from('timetable_slots').select('id', { count: 'exact', head: true }).eq('timetable_id', timetable.id)
    : { count: 0 };

  const displayName = profile?.display_name ?? profile?.full_name ?? 'أستاذنا';

  return (
    <div className="onboarding-card centered-card">
      <div className="success-icon large-success"><CheckCircle2 size={38} /></div>
      <span className="eyebrow">كل شيء جاهز</span>
      <h1>مرحبًا {displayName} 👋</h1>
      <p className="muted-copy">أصبح مكتبك الأساسي جاهزًا. يمكنك الآن الدخول إلى صفحة «يومي» ومتابعة بناء تجربتك.</p>

      {error ? <div className="form-alert error">{error}</div> : null}

      <div className="setup-summary">
        <div><GraduationCap size={20} /><span><strong>المستوى</strong>السنة الثالثة ابتدائي</span></div>
        <div><Languages size={20} /><span><strong>المادة</strong>اللغة العربية</span></div>
        <div><CalendarDays size={20} /><span><strong>الجدول</strong>{slotsCount ?? 0} حصة مسجلة</span></div>
      </div>

      {context.class_name ? <div className="info-strip">القسم: <strong>{context.class_name}</strong></div> : null}

      <form action={finishOnboardingAction}>
        <button className="primary-btn wide" type="submit">دخول إلى مكتبي</button>
      </form>
    </div>
  );
}
