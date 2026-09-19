import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  BookOpenText,
  CalendarDays,
  Clock3,
  FileText,
  GraduationCap,
  Library,
  NotebookTabs,
  Plus,
  Search,
  Settings2,
  UserRound,
} from 'lucide-react';
import { requireCompletedTeacherContext } from '@/lib/auth';
import { getCurriculumContext } from '@/lib/v1';

const weekdayMap: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function localClock(now: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Algiers',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
}

function localHour(now: Date) {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Algiers',
      hour: '2-digit',
      hour12: false,
    }).format(now),
  );
}

function compactTime(value: string) {
  return value.slice(0, 5);
}

export default async function TodayPage() {
  const { supabase, userId, context } = await requireCompletedTeacherContext();
  const now = new Date();
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Algiers',
    weekday: 'short',
  }).format(now);
  const dayNumber = weekdayMap[weekday];
  const currentTime = localClock(now);
  const hour = localHour(now);
  const greeting = hour < 12 ? 'صباح الخير' : 'مساء الخير';
  const dateLabel = new Intl.DateTimeFormat('ar-DZ', {
    timeZone: 'Africa/Algiers',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const [{ data: profile }, { data: timetable }, curriculumContext] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, full_name')
      .eq('id', userId)
      .single(),
    supabase
      .from('teacher_timetables')
      .select('id')
      .eq('teacher_context_id', context.id)
      .eq('is_active', true)
      .maybeSingle(),
    getCurriculumContext(supabase, context.curriculum_id),
  ]);

  const gradeName = curriculumContext?.grade.name_ar ?? 'التعليم الابتدائي';
  const gradeCode = curriculumContext?.grade.code ?? 'ابتدائي';
  const subjectName = curriculumContext?.subject.name_ar ?? 'اللغة العربية';
  const academicYear = curriculumContext?.year.name ?? '2026–2027';
  const teacherName = profile?.display_name ?? profile?.full_name ?? 'أستاذنا';

  const { data: slots } = timetable
    ? await supabase
        .from('timetable_slots')
        .select('id, start_time, end_time, day_of_week, note')
        .eq('timetable_id', timetable.id)
        .eq('day_of_week', dayNumber)
        .order('start_time')
    : { data: [] };

  const { data: units } = await supabase
    .from('units')
    .select('id, title, order_index')
    .eq('curriculum_id', context.curriculum_id)
    .eq('status', 'published')
    .order('order_index');

  const unitIds = (units ?? []).map((unit) => unit.id);
  const { data: weeks } = unitIds.length
    ? await supabase
        .from('weeks')
        .select('id, unit_id, number, title, order_index')
        .in('unit_id', unitIds)
        .eq('status', 'published')
        .order('order_index')
    : { data: [] };

  const weekIds = (weeks ?? []).map((week) => week.id);
  const { data: lessons } = weekIds.length
    ? await supabase
        .from('lessons')
        .select('id, week_id, domain_id, title, lesson_number, order_index, duration_minutes')
        .in('week_id', weekIds)
        .eq('status', 'published')
    : { data: [] };

  const lessonIds = (lessons ?? []).map((lesson) => lesson.id);
  const [{ data: progressRows }, { data: domains }] = await Promise.all([
    lessonIds.length
      ? supabase
          .from('teacher_lesson_progress')
          .select('lesson_id, status, completion_percent')
          .eq('teacher_context_id', context.id)
          .in('lesson_id', lessonIds)
      : Promise.resolve({ data: [] }),
    curriculumContext
      ? supabase
          .from('domains')
          .select('id, name_ar')
          .eq('subject_id', curriculumContext.subject.id)
          .eq('is_active', true)
      : Promise.resolve({ data: [] }),
  ]);

  const unitById = new Map((units ?? []).map((unit) => [unit.id, unit]));
  const weekById = new Map((weeks ?? []).map((week) => [week.id, week]));
  const domainById = new Map((domains ?? []).map((domain) => [domain.id, domain.name_ar]));
  const progressByLesson = new Map((progressRows ?? []).map((row) => [row.lesson_id, row]));

  const orderedLessons = [...(lessons ?? [])].sort((a, b) => {
    const weekA = weekById.get(a.week_id);
    const weekB = weekById.get(b.week_id);
    const unitA = weekA ? unitById.get(weekA.unit_id) : null;
    const unitB = weekB ? unitById.get(weekB.unit_id) : null;
    return (
      (unitA?.order_index ?? 0) - (unitB?.order_index ?? 0) ||
      (weekA?.order_index ?? 0) - (weekB?.order_index ?? 0) ||
      a.order_index - b.order_index
    );
  });

  const isFinished = (lessonId: string) => {
    const status = progressByLesson.get(lessonId)?.status;
    return status === 'completed' || status === 'skipped';
  };

  const pendingLessons = orderedLessons.filter((lesson) => !isFinished(lesson.id));
  const nextLesson = pendingLessons[0] ?? null;
  const completedLessons = orderedLessons.filter((lesson) => progressByLesson.get(lesson.id)?.status === 'completed').length;
  const totalLessons = orderedLessons.length;
  const progressPercent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const schedule = (slots ?? []).map((slot, index) => {
    const start = compactTime(slot.start_time);
    const end = compactTime(slot.end_time);
    const state = currentTime >= start && currentTime < end ? 'current' : currentTime < start ? 'upcoming' : 'finished';
    const lesson = pendingLessons[index] ?? null;
    return { ...slot, start, end, state, lesson };
  });

  const nextScheduleItem = schedule.find((item) => item.state === 'current') ?? schedule.find((item) => item.state === 'upcoming');
  const nextCardLesson = nextScheduleItem?.lesson ?? nextLesson;
  const nextWeek = nextCardLesson ? weekById.get(nextCardLesson.week_id) : null;
  const nextUnit = nextWeek ? unitById.get(nextWeek.unit_id) : null;
  const nextDomainName = nextCardLesson?.domain_id ? domainById.get(nextCardLesson.domain_id) : null;
  const dayIsOver = schedule.length > 0 && !nextScheduleItem;
  const preparationHref = nextCardLesson ? `/lessons/${nextCardLesson.id}` : '/planning';

  return (
    <div className="today-v3">
      <header className="today-v3-toolbar" aria-label="أدوات الصفحة">
        <div className="today-v3-user">
          <span className="today-v3-avatar" aria-hidden="true"><UserRound size={19} /></span>
          <div>
            <strong><bdi>{teacherName}</bdi></strong>
            <span>{gradeName}</span>
          </div>
        </div>

        <div className="today-v3-search" role="search">
          <Search size={18} />
          <span>ابحث عن درس، نشاط أو مورد...</span>
        </div>

        <button className="today-v3-icon-button" type="button" aria-label="الإشعارات">
          <Bell size={19} />
        </button>
      </header>

      <section className="today-v3-page-header">
        <div className="today-v3-page-heading">
          <span className="today-v3-date">{dateLabel}</span>
          <h1>{greeting}، <bdi>{teacherName}</bdi></h1>
          <p>هذا ملخص يومك الدراسي وما تحتاجه للانتقال إلى خطوتك التالية بوضوح.</p>
          <div className="today-v3-context-row" aria-label="السياق الدراسي الحالي">
            <span><GraduationCap size={16} /> {gradeName}</span>
            <span><BookOpen size={16} /> {subjectName}</span>
            <span><CalendarDays size={16} /> <bdi dir="ltr">{academicYear}</bdi></span>
            {context.class_name ? <span><UserRound size={16} /> {context.class_name}</span> : null}
          </div>
        </div>

        <Link href={preparationHref} className="today-v3-primary-action">
          <Plus size={18} />
          تحضير حصة
        </Link>
      </section>

      <section className="today-v3-next" aria-labelledby="next-lesson-title">
        <div className="today-v3-next-accent" aria-hidden="true" />
        <div className="today-v3-next-header">
          <div>
            <span className="today-v3-eyebrow">خطوتك الأهم الآن</span>
            <h2 id="next-lesson-title">{dayIsOver ? 'حضّر حصة الغد' : 'حصتك القادمة'}</h2>
          </div>
          {nextScheduleItem ? (
            <span className="today-v3-time-pill"><Clock3 size={16} /> <bdi dir="ltr">{nextScheduleItem.start} – {nextScheduleItem.end}</bdi></span>
          ) : null}
        </div>

        {nextCardLesson ? (
          <div className="today-v3-next-content">
            <div className="today-v3-next-icon" aria-hidden="true"><BookOpenText size={30} /></div>
            <div className="today-v3-next-copy">
              <div className="today-v3-lesson-meta">
                <span>{subjectName}</span>
                <span>{gradeName}</span>
                {nextUnit ? <span>{nextUnit.title}</span> : null}
                {nextWeek ? <span>الأسبوع {nextWeek.number}</span> : null}
              </div>
              {nextDomainName ? <span className="today-v3-domain">{nextDomainName}</span> : null}
              <h3>{nextCardLesson.title}</h3>
              <p>افتح مساحة التحضير للوصول إلى المذكرة والنص والوسائل والأنشطة والتقويم.</p>
            </div>
            <Link href={`/lessons/${nextCardLesson.id}`} className="today-v3-next-cta">
              حضّر حصتي <ArrowLeft size={18} />
            </Link>
          </div>
        ) : (
          <div className="today-v3-next-empty">
            <div className="today-v3-empty-icon" aria-hidden="true"><BookOpenText size={24} /></div>
            <div>
              <strong>{totalLessons ? 'أكملت الدروس المنشورة لهذا المستوى' : 'برنامج هذا المستوى قيد الإعداد'}</strong>
              <p>{totalLessons ? 'يمكنك مراجعة التخطيط الكامل أو العودة إلى مواردك المحفوظة.' : 'ستظهر حصتك القادمة هنا فور نشر البرنامج والدروس الرسمية.'}</p>
              {nextScheduleItem ? <span className="today-v3-empty-note">لديك حصة مسجلة في الجدول عند <bdi dir="ltr">{nextScheduleItem.start}</bdi>.</span> : null}
            </div>
            <Link href="/planning" className="today-v3-ghost-action">عرض التخطيط <ArrowLeft size={16} /></Link>
          </div>
        )}
      </section>

      <section className="today-v3-progress" aria-labelledby="academic-progress-title">
        <div className="today-v3-section-heading">
          <div>
            <span className="today-v3-eyebrow">المتابعة الأكاديمية</span>
            <h2 id="academic-progress-title">تقدمك الدراسي</h2>
          </div>
          <Link href="/planning" className="today-v3-text-action">عرض التخطيط الكامل <ArrowLeft size={16} /></Link>
        </div>

        <div className="today-v3-progress-grid">
          <div className="today-v3-progress-main">
            <div className="today-v3-progress-number">{progressPercent}%</div>
            <div className="today-v3-progress-track" aria-label={`نسبة التقدم ${progressPercent}%`}>
              <span style={{ width: `${Math.max(progressPercent, totalLessons ? 2 : 0)}%` }} />
            </div>
            {totalLessons ? (
              <p>تم إنجاز <strong>{completedLessons}</strong> من <strong>{totalLessons}</strong> درسًا منشورًا.</p>
            ) : (
              <p>سيبدأ احتساب التقدم تلقائيًا بعد نشر المقاطع والدروس الرسمية لهذا المستوى.</p>
            )}
          </div>

          <div className="today-v3-progress-context">
            <div>
              <span>المستوى الحالي</span>
              <strong>{gradeName}</strong>
              <small><bdi dir="ltr">{gradeCode}</bdi> • {subjectName}</small>
            </div>
            <div>
              <span>{nextUnit ? 'المقطع الحالي' : 'المحتوى الحالي'}</span>
              <strong>{nextUnit?.title ?? (totalLessons ? 'البرنامج مكتمل' : 'بانتظار نشر البرنامج')}</strong>
              <small>{nextCardLesson ? `الحصة التالية: ${nextCardLesson.title}` : 'لا توجد حصة منشورة حاليًا'}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="today-v3-support-grid">
        <article className="today-v3-support-card today-v3-schedule" aria-labelledby="today-schedule-title">
          <div className="today-v3-section-heading compact">
            <div>
              <span className="today-v3-eyebrow">{dateLabel}</span>
              <h2 id="today-schedule-title">جدول اليوم</h2>
            </div>
            <CalendarDays size={20} />
          </div>

          {schedule.length ? (
            <div className="today-v3-schedule-list">
              {schedule.map((item, index) => {
                const itemDomain = item.lesson?.domain_id ? domainById.get(item.lesson.domain_id) : null;
                const label = item.note || itemDomain || item.lesson?.title || subjectName;
                return (
                  <div className={`today-v3-schedule-row is-${item.state}`} key={item.id}>
                    <span className="today-v3-schedule-index">{index + 1}</span>
                    <bdi dir="ltr" className="today-v3-schedule-time">{item.start}</bdi>
                    <div>
                      <strong>{label}</strong>
                      <span>حتى <bdi dir="ltr">{item.end}</bdi></span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="today-v3-compact-empty">
              <span className="today-v3-empty-icon" aria-hidden="true"><CalendarDays size={22} /></span>
              <div>
                <strong>لا توجد حصص اليوم</strong>
                <p>يمكنك تعديل جدول استعمال الزمن من حسابك.</p>
              </div>
              <Link href="/account" className="today-v3-small-link"><Settings2 size={15} /> الحساب</Link>
            </div>
          )}
        </article>

        <article className="today-v3-support-card today-v3-preparation" aria-labelledby="lesson-preparation-title">
          <div className="today-v3-section-heading compact">
            <div>
              <span className="today-v3-eyebrow">وصول سريع</span>
              <h2 id="lesson-preparation-title">تحضير الحصة</h2>
            </div>
            <FileText size={20} />
          </div>

          {nextCardLesson ? (
            <div className="today-v3-preparation-content">
              <strong>{nextCardLesson.title}</strong>
              <p>المذكرة، النص، الوسائل، الأنشطة، التقويم والمعالجة في مساحة واحدة.</p>
              <Link href={`/lessons/${nextCardLesson.id}`} className="today-v3-secondary-action">فتح التحضير <ArrowLeft size={16} /></Link>
            </div>
          ) : (
            <div className="today-v3-preparation-empty">
              <span className="today-v3-preparation-mark" aria-hidden="true"><FileText size={25} /></span>
              <div>
                <strong>التحضير غير متاح بعد</strong>
                <p>سيصبح التحضير متاحًا عند نشر أول درس لهذا المستوى.</p>
              </div>
              <Link href="/planning" className="today-v3-small-link">عرض التخطيط <ArrowLeft size={15} /></Link>
            </div>
          )}
        </article>
      </section>

      <section className="today-v3-quick-section" aria-labelledby="quick-access-title">
        <div className="today-v3-section-heading open">
          <div>
            <span className="today-v3-eyebrow">اختصارات العمل</span>
            <h2 id="quick-access-title">وصول سريع</h2>
          </div>
          <p>الأدوات التي تحتاجها أكثر خلال يومك الدراسي.</p>
        </div>

        <div className="today-v3-quick-grid">
          <Link href="/journal" className="today-v3-action-card" data-tone="amber">
            <span className="today-v3-action-icon"><NotebookTabs size={23} /></span>
            <span className="today-v3-action-copy"><strong>الدفتر اليومي</strong><small>إنشاء، معاينة وطباعة</small></span>
            <ArrowLeft className="today-v3-action-arrow" size={18} />
          </Link>
          <Link href="/resources" className="today-v3-action-card" data-tone="blue">
            <span className="today-v3-action-icon"><BookOpen size={23} /></span>
            <span className="today-v3-action-copy"><strong>الموارد</strong><small>نصوص، صور وتمارين</small></span>
            <ArrowLeft className="today-v3-action-arrow" size={18} />
          </Link>
          <Link href="/planning" className="today-v3-action-card" data-tone="green">
            <span className="today-v3-action-icon"><CalendarDays size={23} /></span>
            <span className="today-v3-action-copy"><strong>البرنامج</strong><small>المقاطع والأسابيع والتقدم</small></span>
            <ArrowLeft className="today-v3-action-arrow" size={18} />
          </Link>
          <Link href="/library" className="today-v3-action-card" data-tone="violet">
            <span className="today-v3-action-icon"><Library size={23} /></span>
            <span className="today-v3-action-copy"><strong>مكتبتي</strong><small>مواردك المحفوظة</small></span>
            <ArrowLeft className="today-v3-action-arrow" size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
