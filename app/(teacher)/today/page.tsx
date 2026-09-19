import Link from 'next/link';
import { Bell, BookOpen, CalendarDays, Clock3, Library, NotebookTabs, Search } from 'lucide-react';
import { requireCompletedTeacherContext } from '@/lib/auth';

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
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Algiers', hour: '2-digit', hour12: false }).format(now));
}

export default async function TodayPage() {
  const { supabase, userId, context } = await requireCompletedTeacherContext();
  const now = new Date();
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Algiers', weekday: 'short' }).format(now);
  const dayNumber = weekdayMap[weekday];
  const currentTime = localClock(now);
  const greeting = localHour(now) < 12 ? 'صباح الخير' : localHour(now) < 18 ? 'مساء الخير' : 'مساء الخير';
  const dateLabel = new Intl.DateTimeFormat('ar-DZ', {
    timeZone: 'Africa/Algiers',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const [{ data: profile }, { data: timetable }] = await Promise.all([
    supabase.from('profiles').select('display_name, full_name').eq('id', userId).single(),
    supabase
      .from('teacher_timetables')
      .select('id')
      .eq('teacher_context_id', context.id)
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  const { data: slots } = timetable
    ? await supabase
        .from('timetable_slots')
        .select('id, start_time, end_time, day_of_week')
        .eq('timetable_id', timetable.id)
        .eq('day_of_week', dayNumber)
        .order('start_time')
    : { data: [] };

  const teacherName = profile?.display_name ?? profile?.full_name ?? 'أستاذنا';
  const schedule = (slots ?? []).map((slot) => {
    const start = slot.start_time.slice(0, 5);
    const end = slot.end_time.slice(0, 5);
    const state = currentTime >= start && currentTime < end ? 'الحصة الحالية' : currentTime < start ? 'قادمة' : 'انتهت';
    return { ...slot, start, end, state };
  });
  const nextSlot = schedule.find((slot) => slot.state === 'الحصة الحالية') ?? schedule.find((slot) => slot.state === 'قادمة');

  return (
    <>
      <header className="topbar">
        <div className="search"><Search size={16} style={{ verticalAlign: 'middle', marginInlineEnd: 8 }} />ابحث عن درس، نشاط أو مورد...</div>
        <button className="teacher-chip" type="button" aria-label="الإشعارات"><Bell size={18} /></button>
        <div className="teacher-chip">
          <div className="avatar">👩🏻‍🏫</div>
          <div className="teacher-meta">
            <strong>{teacherName}</strong>
            <div className="small">السنة الثالثة ابتدائي</div>
          </div>
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="small">{dateLabel}</div>
          <h2>{greeting} {teacherName} 👋</h2>
          <p>يوم موفق مع تلاميذك، وتحضير مرتب من أول حصة إلى آخرها.</p>
        </div>
        <div className="hero-art">
          <strong>اللغة العربية</strong>
          <span>السنة الثالثة ابتدائي • 2026–2027</span>
        </div>
      </section>

      <section className="grid-2">
        <div className="card">
          <div className="card-title">
            <h3>{nextSlot ? 'حصتك القادمة' : 'حصص اليوم'}</h3>
            {nextSlot ? <span className="small"><Clock3 size={14} style={{ verticalAlign: 'middle', marginInlineEnd: 5 }} />{nextSlot.start} – {nextSlot.end}</span> : null}
          </div>
          {nextSlot ? (
            <div className="next-lesson">
              <div className="lesson-icon">📖</div>
              <div className="lesson-copy">
                <h4>اللغة العربية</h4>
                <p>{context.class_name || 'السنة الثالثة ابتدائي'} • {nextSlot.state}</p>
              </div>
              <Link href="/planning" className="primary-btn">عرض التخطيط</Link>
            </div>
          ) : (
            <div className="empty-state">
              <strong>{schedule.length ? 'انتهت حصصك المسجلة لهذا اليوم.' : 'لا توجد حصص مسجلة لهذا اليوم.'}</strong>
              <span>يمكنك تعديل جدول استعمال الزمن لاحقًا من حسابك.</span>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            <h3>جدول اليوم</h3>
            <span className="small">{schedule.length} حصة</span>
          </div>
          {schedule.length ? (
            <div className="schedule">
              {schedule.map((item, index) => (
                <div className="schedule-row" key={item.id}>
                  <div className="time">{item.start}</div>
                  <div>
                    <strong>اللغة العربية</strong>
                    <div className="small">{item.state} • حتى {item.end}</div>
                  </div>
                  <div className="dot">{index + 1}</div>
                </div>
              ))}
            </div>
          ) : <div className="empty-state compact"><span>لا توجد حصص في جدول هذا اليوم.</span></div>}
        </div>
      </section>

      <section className="quick-grid" aria-label="الوصول السريع">
        <Link className="quick-card" href="/journal">
          <NotebookTabs size={24} />
          <div><strong>الدفتر اليومي</strong><br /><span>إنشاء، معاينة وطباعة</span></div>
        </Link>
        <Link className="quick-card" href="/resources">
          <BookOpen size={24} />
          <div><strong>الموارد</strong><br /><span>نصوص، صور وتمارين</span></div>
        </Link>
        <Link className="quick-card" href="/planning">
          <CalendarDays size={24} />
          <div><strong>التخطيط</strong><br /><span>المقاطع والأسابيع والتقدم</span></div>
        </Link>
        <Link className="quick-card" href="/library">
          <Library size={24} />
          <div><strong>مكتبتي</strong><br /><span>مواردك المحفوظة</span></div>
        </Link>
      </section>

      <section className="card progress-card">
        <div className="progress-head">
          <div>
            <div className="small">برنامج 3AP • اللغة العربية</div>
            <h3 style={{ margin: '4px 0 0' }}>تقدمك الدراسي</h3>
          </div>
          <strong>جاهز</strong>
        </div>
        <div className="progress-line"><div className="progress-value initial-progress" /></div>
        <div className="small">سيبدأ احتساب التقدم تلقائيًا بعد نشر المقاطع والحصص الرسمية.</div>
      </section>
    </>
  );
}
