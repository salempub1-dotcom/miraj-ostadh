import Link from 'next/link';
import {
  ArrowLeft,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CircleDashed,
  Clock3,
  Layers3,
  PauseCircle,
  Route,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { requireCompletedTeacherContext } from '@/lib/auth';
import { getPlanningData, type LessonProgressStatus } from '@/lib/planning';

const STATUS_META: Record<LessonProgressStatus, { label: string; className: string }> = {
  not_started: { label: 'لم يبدأ', className: 'status-not-started' },
  in_progress: { label: 'جارٍ', className: 'status-in-progress' },
  completed: { label: 'مكتمل', className: 'status-completed' },
  partial: { label: 'جزئي', className: 'status-partial' },
  postponed: { label: 'مؤجل', className: 'status-postponed' },
  skipped: { label: 'متجاوز', className: 'status-skipped' },
};

const FILTERS: Array<{ value: 'all' | LessonProgressStatus; label: string }> = [
  { value: 'all', label: 'الكل' },
  { value: 'not_started', label: 'لم يبدأ' },
  { value: 'in_progress', label: 'جارٍ' },
  { value: 'partial', label: 'جزئي' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'postponed', label: 'مؤجل' },
  { value: 'skipped', label: 'متجاوز' },
];

function isProgressStatus(value: string | undefined): value is LessonProgressStatus {
  return Boolean(value && value in STATUS_META);
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase, context } = await requireCompletedTeacherContext();
  const params = await searchParams;
  const activeFilter: 'all' | LessonProgressStatus = isProgressStatus(params.status) ? params.status : 'all';
  const planning = await getPlanningData(supabase, context.id, context.curriculum_id);

  if (!planning) {
    return (
      <section className="planning-shell">
        <div className="planning-page-head">
          <div>
            <span className="planning-eyebrow">التخطيط والمتابعة</span>
            <h1>برنامجك الدراسي</h1>
            <p>تعذر تحميل سياق البرنامج الحالي. أعد المحاولة بعد قليل.</p>
          </div>
        </div>
      </section>
    );
  }

  const currentUnitId = planning.currentLesson?.unitId ?? null;
  const remainingLessons = Math.max(planning.totalLessons - planning.completedLessons, 0);

  return (
    <section className="planning-shell">
      <header className="planning-page-head">
        <div>
          <span className="planning-eyebrow">التخطيط والمتابعة</span>
          <h1>برنامجك الدراسي</h1>
          <p>تابع أين وصلت، راجع المقاطع والأسابيع، وانتقل إلى الحصة المناسبة دون فقدان تسلسل البرنامج.</p>
        </div>
        <Link href="/planning/progress" className="planning-adjust-btn">
          <SlidersHorizontal size={18} />
          تعديل تقدمي
        </Link>
      </header>

      <div className="planning-context-strip">
        <div><span>المستوى</span><strong>{planning.curriculum.gradeName}</strong><small>{planning.curriculum.gradeCode}</small></div>
        <div><span>المادة</span><strong>{planning.curriculum.subjectName}</strong></div>
        <div><span>السنة الدراسية</span><strong dir="ltr">{planning.curriculum.academicYear}</strong></div>
      </div>

      <section className="planning-summary-grid" aria-label="ملخص التقدم">
        <article className="planning-summary-card planning-summary-primary">
          <div className="summary-icon"><Route size={24} /></div>
          <div>
            <span>التقدم الإجمالي</span>
            <strong>{planning.progressPercent}%</strong>
            <small>{planning.completedLessons} من {planning.totalLessons} درسًا مكتملًا</small>
          </div>
          <div className="planning-summary-progress" aria-label={`نسبة التقدم ${planning.progressPercent}%`}>
            <span style={{ width: `${planning.progressPercent}%` }} />
          </div>
        </article>

        <article className="planning-summary-card">
          <div className="summary-icon soft-green"><CheckCircle2 size={23} /></div>
          <div><span>الدروس المكتملة</span><strong>{planning.completedLessons}</strong><small>تم تأكيد إنجازها</small></div>
        </article>

        <article className="planning-summary-card">
          <div className="summary-icon soft-orange"><Clock3 size={23} /></div>
          <div><span>المتبقي</span><strong>{remainingLessons}</strong><small>ضمن المحتوى المنشور</small></div>
        </article>

        <article className="planning-summary-card">
          <div className="summary-icon soft-blue"><Layers3 size={23} /></div>
          <div><span>المقاطع</span><strong>{planning.units.length}</strong><small>مقطع منشور</small></div>
        </article>
      </section>

      {planning.currentLesson ? (
        <section className="planning-current-card">
          <div className="planning-current-icon"><Sparkles size={23} /></div>
          <div className="planning-current-copy">
            <span>موضعك الحالي في البرنامج</span>
            <h2>{planning.currentLesson.title}</h2>
            <p>
              {planning.currentLesson.unitTitle} • الأسبوع {planning.currentLesson.weekNumber}
              {planning.currentLesson.domainName ? ` • ${planning.currentLesson.domainName}` : ''}
            </p>
          </div>
          <Link href={`/lessons/${planning.currentLesson.id}`} className="planning-primary-link">
            فتح الحصة <ArrowLeft size={17} />
          </Link>
        </section>
      ) : planning.totalLessons ? (
        <section className="planning-current-card planning-complete-card">
          <div className="planning-current-icon"><CheckCircle2 size={23} /></div>
          <div className="planning-current-copy"><span>حالة البرنامج</span><h2>أكملت كل الدروس المنشورة</h2><p>يمكنك مراجعة المقاطع أو العودة إلى مواردك وتحضيراتك.</p></div>
        </section>
      ) : null}

      {planning.totalLessons > 0 ? (
        <nav className="planning-filters" aria-label="تصفية الدروس حسب الحالة">
          {FILTERS.map((filter) => {
            const href = filter.value === 'all' ? '/planning' : `/planning?status=${filter.value}`;
            return <Link key={filter.value} href={href} className={activeFilter === filter.value ? 'active' : undefined}>{filter.label}</Link>;
          })}
        </nav>
      ) : null}

      {planning.units.length === 0 ? (
        <section className="planning-empty-state">
          <div className="planning-empty-icon"><CalendarDays size={34} /></div>
          <span className="planning-eyebrow">الهيكلة جاهزة</span>
          <h2>لم تُنشر مقاطع البرنامج الرسمي لهذا المستوى بعد</h2>
          <p>عند إضافة ملفات البرنامج لاحقًا سنرتبها تلقائيًا هنا حسب المقطع، الأسبوع والحصة، وستبدأ المتابعة من نفس الصفحة دون تغيير الهيكلة.</p>
          <div className="planning-empty-features">
            <div><Layers3 size={19} /><span><strong>المقاطع والأسابيع</strong><small>ترتيب هرمي واضح للبرنامج</small></span></div>
            <div><BookOpenText size={19} /><span><strong>الدروس والتحضير</strong><small>كل درس مرتبط بصفحة تحضيره</small></span></div>
            <div><Route size={19} /><span><strong>متابعة تلقائية</strong><small>موضع الأستاذ يتحدث بعد إنجاز الحصص</small></span></div>
          </div>
        </section>
      ) : (
        <div className="planning-units-list">
          {planning.units.map((unit) => {
            const unitLessons = unit.weeks.flatMap((week) => week.lessons);
            const visibleLessons = activeFilter === 'all' ? unitLessons : unitLessons.filter((lesson) => lesson.status === activeFilter);
            if (activeFilter !== 'all' && visibleLessons.length === 0) return null;

            return (
              <details key={unit.id} className={`planning-unit ${currentUnitId === unit.id ? 'current' : ''}`} open={currentUnitId === unit.id || activeFilter !== 'all'}>
                <summary>
                  <div className="unit-number">{unit.number}</div>
                  <div className="unit-summary-copy">
                    <span>المقطع {unit.number}</span>
                    <h2>{unit.title}</h2>
                    {unit.description ? <p>{unit.description}</p> : null}
                  </div>
                  <div className="unit-progress-copy">
                    <strong>{unit.completedLessons}/{unit.totalLessons}</strong>
                    <span>{unit.progressPercent}%</span>
                  </div>
                  <div className="unit-progress-track"><span style={{ width: `${unit.progressPercent}%` }} /></div>
                  <ChevronLeft className="unit-chevron" size={20} />
                </summary>

                <div className="planning-weeks-list">
                  {unit.weeks.map((week) => {
                    const weekLessons = activeFilter === 'all' ? week.lessons : week.lessons.filter((lesson) => lesson.status === activeFilter);
                    if (activeFilter !== 'all' && weekLessons.length === 0) return null;

                    return (
                      <section className="planning-week" key={week.id}>
                        <header className="planning-week-head">
                          <div>
                            <span>الأسبوع {week.number}</span>
                            <h3>{week.title || `الأسبوع ${week.number}`}</h3>
                          </div>
                          <div className="week-progress"><strong>{week.completedLessons}/{week.totalLessons}</strong><span>{week.progressPercent}%</span></div>
                        </header>

                        {weekLessons.length ? (
                          <div className="planning-lessons-list">
                            {weekLessons.map((lesson) => {
                              const meta = STATUS_META[lesson.status];
                              const StatusIcon = lesson.status === 'completed'
                                ? CheckCircle2
                                : lesson.status === 'partial'
                                  ? PauseCircle
                                  : lesson.status === 'skipped'
                                    ? SkipForward
                                    : CircleDashed;

                              return (
                                <Link href={`/lessons/${lesson.id}`} className="planning-lesson-row" key={lesson.id}>
                                  <div className={`lesson-status-icon ${meta.className}`}><StatusIcon size={18} /></div>
                                  <div className="planning-lesson-main">
                                    <span>الحصة {lesson.lessonNumber}{lesson.domainName ? ` • ${lesson.domainName}` : ''}</span>
                                    <strong>{lesson.title}</strong>
                                  </div>
                                  <div className="lesson-duration"><Clock3 size={14} />{lesson.durationMinutes} د</div>
                                  <span className={`planning-status-badge ${meta.className}`}>{meta.label}</span>
                                  <ChevronLeft size={18} />
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="planning-week-empty">لا توجد دروس منشورة داخل هذا الأسبوع بعد.</div>
                        )}
                      </section>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
