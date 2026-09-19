import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  BookOpenText,
  CalendarDays,
  Clock3,
  FileText,
  Library,
  NotebookTabs,
  Search,
  Sparkles,
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

  return (
    <div className="today-dashboard">
      <header className="topbar today-topbar">
        <div className="search">
          <Search size={17} />
          <span>ابحث عن درس، نشاط أو مورد...</span>
        </div>
        <button className="teacher-chip icon-chip" type="button" aria-label="الإشعارات"><Bell size={18} /></button>
        <div className="teacher-chip">
          <div className="avatar">👨🏻‍🏫</div>
          <div className="teacher-meta">
            <strong>{teacherName}</strong>
            <div className="small">{gradeName}</div>
          </div>
        </div>
      </header>

      <section className="hero today-hero">
        <div className="hero-copy">
          <div className="hero-date">{dateLabel}</div>
          <h2>{greeting} {teacherName} <span aria-hidden="true">👋</span></h2>
          <p>بالعلم نرتقي، وتحضيرك اليومي يبدأ من مكان واحد مرتب وواضح.</p>
          <div className="hero-tags">
            <span>{gradeCode}</span>
            <span>{subjectName}</span>
            <span>{academicYear}</span>
          </div>
        </div>
        <div className="hero-classroom" aria-hidden="true">
          <div className="hero-books"><span /><span /><span /></div>
          <div className="hero-board">
            <BookOpenText size={30} />
            <strong>{subjectName}</strong>
            <span>{gradeName}</span>
          </div>
          <div className="hero-pencil-pot">✏️</div>
        </div>
      </section>

      <section className="grid-2 today-primary-grid">
        <div className="card next-card">
          <div className="card-title">
            <div>
              <span className="section-kicker">خطوتك التالية</span>
              <h3>{dayIsOver ? 'حضّر حصة الغد' : 'حصتك القادمة'}</h3>
            </div>
            {nextScheduleItem ? (
              <span className="time-pill"><Clock3 size={14} />{nextScheduleItem.start} – {nextScheduleItem.end}</span>
            ) : null}
          </div>

          {nextCardLesson ? (
            <div className="next-lesson next-lesson-v2">
              <div className="lesson-icon"><BookOpenText size={30} /></div>
              <div className="lesson-copy">
                {nextDomainName ? <span className="lesson-domain">{nextDomainName}</span> : null}
                <h4>{nextCardLesson.title}</h4>
                <p>{gradeName}{nextUnit ? ` • ${nextUnit.title}` : ''}{nextWeek ? ` • الأسبوع ${nextWeek.number}` : ''}</p>
              </div>
              <Link href={`/lessons/${nextCardLesson.id}`} className="primary-btn lesson-cta">
                حضّر حصتي <ArrowLeft size={17} />
              </Link>
            </div>
          ) : (
            <div className="empty-state lesson-empty">
              <div className="empty-state-icon"><Sparkles size={22} /></div>
              <strong>{totalLessons ? 'أكملت الدروس المنشورة لهذا المستوى.' : 'برنامج هذا المستوى قيد الإعداد.'}</strong>
              <span>{totalLessons ? 'يمكنك مراجعة التخطيط أو مواردك المحفوظة.' : 'سنظهر الحصة التالية هنا فور نشر الدروس الرسمية.'}</span>
              <Link href="/planning" className="secondary-link">عرض التخطيط</Link>
            </div>
          )}
        </div>

        <div className="card schedule-card">
          <div className="card-title">
            <div>
              <span className="section-kicker">{dateLabel}</span>
              <h3>جدول اليوم</h3>
            </div>
            <CalendarDays size={20} />
          </div>

          {schedule.length ? (
            <div className="schedule schedule-v2">
              {schedule.map((item, index) => {
                const itemDomain = item.lesson?.domain_id ? domainById.get(item.lesson.domain_id) : null;
                const label = item.note || itemDomain || item.lesson?.title || subjectName;
                return (
                  <div className={`schedule-row schedule-${item.state}`} key={item.id}>
                    <div className={`dot dot-${(index % 5) + 1}`}>{index + 1}</div>
                    <div className="time">{item.start}</div>
                    <div className="schedule-copy">
                      <strong>{label}</strong>
                      <div className="small">حتى {item.end}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state compact">
              <strong>لا توجد حصص مسجلة لهذا اليوم.</strong>
              <span>يمكنك تعديل جدول استعمال الزمن من حسابك.</span>
            </div>
          )}
        </div>
      </section>

      <section className="quick-grid" aria-label="الوصول السريع">
        <Link className="quick-card" href="/journal">
          <span className="quick-icon"><NotebookTabs size={26} /></span>
          <div><strong>الدفتر اليومي</strong><br /><span>إنشاء، معاينة وطباعة</span></div>
        </Link>
        <Link className="quick-card" href="/resources">
          <span className="quick-icon"><BookOpen size={26} /></span>
          <div><strong>الموارد</strong><br /><span>نصوص، صور وتمارين</span></div>
        </Link>
        <Link className="quick-card" href="/planning">
          <span className="quick-icon"><CalendarDays size={26} /></span>
          <div><strong>البرنامج</strong><br /><span>المقاطع والأسابيع والتقدم</span></div>
        </Link>
        <Link className="quick-card" href="/library">
          <span className="quick-icon"><Library size={26} /></span>
          <div><strong>مكتبتي</strong><br /><span>مواردك المحفوظة</span></div>
        </Link>
      </section>

      <section className="today-lower-grid">
        <div className="card progress-card progress-card-v2">
          <div className="progress-head">
            <div>
              <span className="section-kicker">برنامج {gradeCode} • {subjectName}</span>
              <h3>تقدمك الدراسي</h3>
            </div>
            <strong className="progress-number">{progressPercent}%</strong>
          </div>
          <div className="progress-line" aria-label={`نسبة التقدم ${progressPercent}%`}>
            <div className="progress-value" style={{ width: `${Math.max(progressPercent, totalLessons ? 2 : 0)}%` }} />
          </div>
          {totalLessons ? (
            <div className="progress-details">
              <span>{completedLessons} من {totalLessons} درسًا مكتملًا</span>
              {nextUnit ? <strong>المقطع الحالي: {nextUnit.title}</strong> : <strong>البرنامج مكتمل</strong>}
            </div>
          ) : (
            <div className="empty-inline">سيبدأ احتساب التقدم تلقائيًا بعد نشر المقاطع والدروس الرسمية لهذا المستوى.</div>
          )}
          <Link href="/planning" className="text-link">عرض التخطيط الكامل <ArrowLeft size={15} /></Link>
        </div>

        <div className="card preparation-preview">
          <div className="card-title">
            <div>
              <span className="section-kicker">وصول سريع</span>
              <h3>تحضير الحصة</h3>
            </div>
            <FileText size={20} />
          </div>
          {nextCardLesson ? (
            <>
              <strong className="preview-title">{nextCardLesson.title}</strong>
              <div className="prep-tabs" aria-label="أقسام التحضير">
                <span>المذكرة</span><span>النص</span><span>الوسائل</span><span>الأنشطة</span><span>التقويم</span><span>المعالجة</span>
              </div>
              <Link href={`/lessons/${nextCardLesson.id}`} className="secondary-btn wide prep-open">فتح التحضير الكامل</Link>
            </>
          ) : (
            <div className="empty-state compact"><span>سيظهر تحضير الحصة هنا عند توفر أول درس منشور.</span></div>
          )}
        </div>
      </section>
    </div>
  );
}
