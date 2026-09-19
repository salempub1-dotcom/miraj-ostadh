import Link from 'next/link';
import { ArrowRight, CheckCircle2, Info, Route, SlidersHorizontal } from 'lucide-react';
import { requireCompletedTeacherContext } from '@/lib/auth';
import { getPlanningData } from '@/lib/planning';
import { saveProgressPositionAction } from './actions';

export default async function EditProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { supabase, context } = await requireCompletedTeacherContext();
  const { error } = await searchParams;
  const planning = await getPlanningData(supabase, context.id, context.curriculum_id);

  return (
    <section className="progress-editor-shell">
      <header className="progress-editor-head">
        <Link href="/planning" className="progress-back-link"><ArrowRight size={17} /> العودة إلى التخطيط</Link>
        <div className="progress-editor-title-row">
          <div className="progress-editor-icon"><SlidersHorizontal size={25} /></div>
          <div>
            <span className="planning-eyebrow">تعديل يدوي</span>
            <h1>أين وصلت في البرنامج؟</h1>
            <p>هذه الخطوة مفيدة خصوصًا إذا بدأت استخدام المنصة في منتصف السنة الدراسية.</p>
          </div>
        </div>
      </header>

      {!planning || planning.totalLessons === 0 ? (
        <div className="progress-editor-empty">
          <Route size={34} />
          <h2>لا توجد دروس منشورة بعد</h2>
          <p>بمجرد إضافة البرنامج الرسمي ستظهر هنا قائمة الحصص ويمكنك تحديد أول حصة لم تنجزها بعد.</p>
          <Link href="/planning" className="planning-primary-link">العودة إلى التخطيط</Link>
        </div>
      ) : (
        <div className="progress-editor-grid">
          <form action={saveProgressPositionAction} className="progress-editor-form">
            {error ? <div className="form-alert error">{error}</div> : null}

            <div className="progress-editor-card">
              <div className="progress-editor-card-head">
                <div className="summary-icon"><Route size={22} /></div>
                <div>
                  <h2>اختر نقطة الانطلاق</h2>
                  <p>اختر أول درس لم تنجزه بعد. ستعتبر المنصة كل الدروس السابقة مكتملة.</p>
                </div>
              </div>

              <label className="progress-select-label">
                <span>أول حصة لم تُنجز بعد</span>
                <select name="lesson_id" defaultValue={planning.currentLesson?.id ?? '__complete__'} required>
                  {planning.units.map((unit) => (
                    <optgroup key={unit.id} label={`المقطع ${unit.number}: ${unit.title}`}>
                      {unit.weeks.flatMap((week) =>
                        week.lessons.map((lesson) => (
                          <option key={lesson.id} value={lesson.id}>
                            {`الأسبوع ${week.number} — الحصة ${lesson.lessonNumber}: ${lesson.title}`}
                          </option>
                        )),
                      )}
                    </optgroup>
                  ))}
                  <option value="__complete__">أنجزت كل الدروس المنشورة</option>
                </select>
              </label>

              <div className="progress-reset-note">
                <Info size={18} />
                <p>عند الحفظ: ما قبل الحصة المختارة يصبح <strong>مكتملًا</strong>، والحصة المختارة وما بعدها يعود إلى <strong>لم يبدأ</strong>. هذا لا يغيّر البرنامج الرسمي، بل يغيّر تقدم حسابك فقط.</p>
              </div>

              <label className="progress-confirm-row">
                <input type="checkbox" name="confirm_reset" required />
                <span>أؤكد أنني أريد إعادة ضبط موضعي في البرنامج بهذه الطريقة.</span>
              </label>

              <button className="planning-primary-link progress-save-btn" type="submit">
                <CheckCircle2 size={18} /> حفظ موضعي الجديد
              </button>
            </div>
          </form>

          <aside className="progress-editor-aside">
            <span className="planning-eyebrow">الوضع الحالي</span>
            <h2>{planning.currentLesson?.title ?? 'البرنامج مكتمل'}</h2>
            {planning.currentLesson ? (
              <p>{planning.currentLesson.unitTitle} • الأسبوع {planning.currentLesson.weekNumber}</p>
            ) : (
              <p>لا توجد حصة غير منجزة ضمن المحتوى المنشور.</p>
            )}
            <div className="progress-aside-stat"><span>نسبة التقدم</span><strong>{planning.progressPercent}%</strong></div>
            <div className="progress-aside-stat"><span>الدروس المكتملة</span><strong>{planning.completedLessons}/{planning.totalLessons}</strong></div>
          </aside>
        </div>
      )}
    </section>
  );
}
