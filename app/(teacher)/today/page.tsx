import Link from 'next/link';
import { Bell, BookOpen, CalendarDays, Clock3, Library, NotebookTabs, Search } from 'lucide-react';

const schedule = [
  { time: '08:00', title: 'فهم المنطوق', state: 'الحصة الحالية' },
  { time: '09:00', title: 'التعبير الشفوي', state: 'قادمة' },
  { time: '10:45', title: 'القراءة', state: 'قادمة' },
  { time: '11:30', title: 'قواعد اللغة', state: 'قادمة' },
];

export default function TodayPage() {
  return (
    <>
      <header className="topbar">
        <div className="search"><Search size={16} style={{ verticalAlign: 'middle', marginInlineEnd: 8 }} />ابحث عن درس، نشاط أو مورد...</div>
        <button className="teacher-chip" type="button" aria-label="الإشعارات"><Bell size={18} /></button>
        <div className="teacher-chip">
          <div className="avatar">👩🏻‍🏫</div>
          <div className="teacher-meta">
            <strong>أستاذة سارة</strong>
            <div className="small">السنة الثالثة ابتدائي</div>
          </div>
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="small">السبت 20 سبتمبر 2026</div>
          <h2>صباح الخير أستاذة سارة 👋</h2>
          <p>يوم موفق مع تلاميذك، وتحضير مرتب من أول حصة إلى آخرها.</p>
        </div>
        <div className="hero-art">
          <strong>اللغة العربية</strong>
          <span>نتعلم، نفهم، ونبني أجيالًا تحب المعرفة.</span>
        </div>
      </section>

      <section className="grid-2">
        <div className="card">
          <div className="card-title">
            <h3>حصتك القادمة</h3>
            <span className="small"><Clock3 size={14} style={{ verticalAlign: 'middle', marginInlineEnd: 5 }} />08:00 – 08:45</span>
          </div>
          <div className="next-lesson">
            <div className="lesson-icon">📖</div>
            <div className="lesson-copy">
              <h4>فهم المنطوق</h4>
              <p>في حديقة المدرسة • المقطع 01 • الأسبوع 03</p>
            </div>
            <Link href="/lessons/demo-lesson" className="primary-btn">حضّر حصتي</Link>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <h3>جدول اليوم</h3>
            <span className="small">4 حصص</span>
          </div>
          <div className="schedule">
            {schedule.map((item, index) => (
              <div className="schedule-row" key={`${item.time}-${item.title}`}>
                <div className="time">{item.time}</div>
                <div>
                  <strong>{item.title}</strong>
                  <div className="small">{item.state}</div>
                </div>
                <div className="dot">{index + 1}</div>
              </div>
            ))}
          </div>
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
            <div className="small">المقطع الأول • الأسبوع الثالث</div>
            <h3 style={{ margin: '4px 0 0' }}>تقدمك هذا الأسبوع</h3>
          </div>
          <strong>75%</strong>
        </div>
        <div className="progress-line"><div className="progress-value" /></div>
        <div className="small">3 من 4 حصص منجزة</div>
      </section>
    </>
  );
}
