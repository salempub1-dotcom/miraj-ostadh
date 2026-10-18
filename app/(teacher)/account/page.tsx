import { Mail, MapPin, School, UserRound } from 'lucide-react';
import { requireCompletedTeacherContext } from '@/lib/auth';
import { getCurriculumContext, getPrimaryArabicCurricula } from '@/lib/v1';
import { changeTeachingGradeAction } from './actions';

export default async function AccountPage({ searchParams }: { searchParams: Promise<{updated?:string;error?:string}> }) {
  const feedback = await searchParams;
  const { supabase, userId, context } = await requireCompletedTeacherContext();
  const [{ data: profile }, { data: timetable }, curriculumContext, availableGrades] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, display_name, email, province, school_name')
      .eq('id', userId)
      .single(),
    supabase
      .from('teacher_timetables')
      .select('id')
      .eq('teacher_context_id', context.id)
      .eq('is_active', true)
      .maybeSingle(),
    getCurriculumContext(supabase, context.curriculum_id),
    getPrimaryArabicCurricula(supabase),
  ]);

  const { count } = timetable
    ? await supabase.from('timetable_slots').select('id', { count: 'exact', head: true }).eq('timetable_id', timetable.id)
    : { count: 0 };

  const gradeCode = curriculumContext?.grade.code ?? 'ابتدائي';
  const gradeName = curriculumContext?.grade.name_ar ?? 'التعليم الابتدائي';
  const subjectName = curriculumContext?.subject.name_ar ?? 'اللغة العربية';
  const academicYear = curriculumContext?.year.name ?? '2026–2027';

  return (
    <section className="account-grid">
      <div className="card account-hero">
        <div className="large-avatar">👨🏻‍🏫</div>
        <div>
          <div className="small">حساب الأستاذ</div>
          <h2>{profile?.display_name ?? profile?.full_name ?? 'الأستاذ'}</h2>
          <p>{gradeCode} • {subjectName} • {academicYear}</p>
          <div className="small">{gradeName}</div>
        </div>
      </div>

      <div className="card details-list">
        <div><UserRound size={18} /><span><strong>المستوى والقسم</strong>{context.class_name || gradeName}</span></div>
        <div><Mail size={18} /><span><strong>البريد الإلكتروني</strong>{profile?.email || '—'}</span></div>
        <div><MapPin size={18} /><span><strong>الولاية</strong>{profile?.province || 'غير محددة'}</span></div>
        <div><School size={18} /><span><strong>المؤسسة</strong>{profile?.school_name || 'غير محددة'}</span></div>
        <div><span className="detail-count">{count ?? 0}</span><span><strong>جدول استعمال الزمن</strong>حصة أسبوعية مسجلة</span></div>
      </div>

      <section className="card grade-profile-settings" id="change-grade">
        <h2>تغيير المستوى الدراسي</h2>
        <p>إذا أصبحت تدرّس سنة أخرى، اختر المستوى الجديد. سنحتفظ بتقدمك وجدولك ومكتبتك في المستوى السابق، ويمكنك العودة إليه لاحقًا.</p>
        {feedback.updated === '1' ? <div className="form-alert" role="status">تم تغيير المستوى الدراسي بنجاح.</div> : null}
        {feedback.error ? <div className="form-alert error" role="alert">{feedback.error}</div> : null}
        <form action={changeTeachingGradeAction} className="form-stack">
          <label>
            <span>السنة التي تدرسها حاليًا</span>
            <select name="grade_code" defaultValue={gradeCode} required>
              {(availableGrades?.options ?? []).map(({grade}) => (
                <option key={grade.code} value={grade.code}>{grade.name_ar}</option>
              ))}
            </select>
          </label>
          <label>
            <span>اسم القسم (اختياري)</span>
            <input name="class_name" type="text" maxLength={100} defaultValue={context.class_name ?? ''} placeholder="مثال: الفوج 02" />
          </label>
          <div className="info-strip">السنة الدراسية: <strong>{academicYear}</strong> — المادة: <strong>{subjectName}</strong></div>
          <button className="primary-btn" type="submit" disabled={!availableGrades?.options.length}>حفظ المستوى الجديد</button>
        </form>
      </section>

      <form action="/auth/signout" method="post" className="card">
        <button className="secondary-btn wide" type="submit">تسجيل الخروج</button>
      </form>
    </section>
  );
}
