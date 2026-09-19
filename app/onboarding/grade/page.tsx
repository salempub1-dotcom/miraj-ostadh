import { redirect } from 'next/navigation';
import { GraduationCap, Languages } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { getPrimaryArabicCurricula } from '@/lib/v1';
import { saveGradeAction } from './actions';

export default async function OnboardingGradePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { supabase, userId } = await requireUser();
  const { error } = await searchParams;
  const primary = await getPrimaryArabicCurricula(supabase);

  const { data: current } = await supabase
    .from('teacher_academic_contexts')
    .select('curriculum_id, class_name, onboarding_completed_at')
    .eq('user_id', userId)
    .eq('is_current', true)
    .maybeSingle();

  if (current?.onboarding_completed_at) redirect('/today');

  const currentOption = primary?.options.find((option) => option.curriculum?.id === current?.curriculum_id);
  const defaultGradeCode = currentOption?.grade.code ?? '3AP';

  return (
    <div className="onboarding-card wide-onboarding-card">
      <div className="step-line"><span className="done" /><span className="active" /><span /><span /></div>
      <span className="eyebrow">الخطوة 2 من 4</span>
      <h1>اختر السنة الدراسية</h1>
      <p className="muted-copy">اختر مستواك من السنة الأولى إلى السنة الخامسة. مادة اللغة العربية هي المادة الأساسية في هذه النسخة.</p>

      {error ? <div className="form-alert error">{error}</div> : null}
      {!primary?.options.length ? <div className="form-alert error">برامج اللغة العربية غير متاحة حاليًا.</div> : null}

      <form action={saveGradeAction} className="form-stack onboarding-form">
        <div className="primary-grade-grid" aria-label="اختيار السنة الدراسية">
          {(primary?.options ?? []).map(({ grade }) => (
            <label className="grade-choice" key={grade.id}>
              <input type="radio" name="grade_code" value={grade.code} defaultChecked={grade.code === defaultGradeCode} />
              <span className="grade-choice-card">
                <span className="grade-choice-icon"><GraduationCap size={22} /></span>
                <strong>{grade.name_ar}</strong>
                <small>{grade.code}</small>
              </span>
            </label>
          ))}
        </div>

        <div className="selection-card selected subject-choice-static">
          <Languages size={25} />
          <div><strong>{primary?.subject.name_ar ?? 'اللغة العربية'}</strong><span>المادة المعتمدة حاليًا لجميع سنوات الابتدائي</span></div>
        </div>

        <label>
          <span>اسم القسم <em>اختياري</em></span>
          <input name="class_name" type="text" defaultValue={current?.class_name ?? ''} placeholder="مثال: القسم أ أو 3AP1" />
        </label>

        <div className="info-strip">السنة الدراسية: <strong>{primary?.year.name ?? '2026–2027'}</strong></div>
        <button className="primary-btn wide" type="submit" disabled={!primary?.options.length}>اعتماد المستوى والمتابعة</button>
      </form>
    </div>
  );
}
