import { redirect } from 'next/navigation';
import { GraduationCap, Languages } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { getV1Curriculum } from '@/lib/v1';
import { saveGradeAction } from './actions';

export default async function OnboardingGradePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { supabase, userId } = await requireUser();
  const { error } = await searchParams;
  const v1 = await getV1Curriculum(supabase);

  const { data: current } = await supabase
    .from('teacher_academic_contexts')
    .select('class_name, onboarding_completed_at')
    .eq('user_id', userId)
    .eq('is_current', true)
    .maybeSingle();

  if (current?.onboarding_completed_at) redirect('/today');

  return (
    <div className="onboarding-card">
      <div className="step-line"><span className="done" /><span className="active" /><span /><span /></div>
      <span className="eyebrow">الخطوة 2 من 4</span>
      <h1>المستوى والمادة</h1>
      <p className="muted-copy">في النسخة الأولى نبدأ بشكل مركز بالسنة الثالثة ابتدائي في اللغة العربية.</p>

      {error ? <div className="form-alert error">{error}</div> : null}
      {!v1 ? <div className="form-alert error">برنامج النسخة الأولى غير متاح حاليًا.</div> : null}

      <form action={saveGradeAction} className="form-stack onboarding-form">
        <div className="selection-grid">
          <div className="selection-card selected">
            <GraduationCap size={25} />
            <div><strong>السنة الثالثة ابتدائي</strong><span>3AP</span></div>
          </div>
          <div className="selection-card selected">
            <Languages size={25} />
            <div><strong>اللغة العربية</strong><span>المادة المتاحة الآن</span></div>
          </div>
        </div>

        <label>
          <span>اسم القسم <em>اختياري</em></span>
          <input name="class_name" type="text" defaultValue={current?.class_name ?? ''} placeholder="مثال: 3AP1 أو السنة الثالثة ب" />
        </label>

        <div className="info-strip">السنة الدراسية: <strong>2026–2027</strong></div>
        <button className="primary-btn wide" type="submit" disabled={!v1}>اعتماد المستوى والمتابعة</button>
      </form>
    </div>
  );
}
