'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, CalendarDays, Clock3, Edit3, Printer } from 'lucide-react';

export type TimetableSlot = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  note: string | null;
};

const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'] as const;

const SUBJECTS = [
  { key: 'arabic', name: 'اللغة العربية' },
  { key: 'math', name: 'الرياضيات' },
  { key: 'islamic', name: 'التربية الإسلامية' },
  { key: 'sport', name: 'التربية البدنية' },
  { key: 'art', name: 'التربية الفنية' },
] as const;

function subjectFor(note: string | null) {
  const value = (note ?? '').trim();
  if (value.includes('رياضيات')) return SUBJECTS[1];
  if (value.includes('إسلامية')) return SUBJECTS[2];
  if (value.includes('بدنية')) return SUBJECTS[3];
  if (value.includes('فنية')) return SUBJECTS[4];
  return SUBJECTS[0];
}

const timeOf = (value: string) => value.slice(0, 5);

function minutesBetween(start: string, end: string) {
  const [sh, sm] = timeOf(start).split(':').map(Number);
  const [eh, em] = timeOf(end).split(':').map(Number);
  return eh * 60 + em - sh * 60 - sm;
}

function durationLabel(minutes: number) {
  return minutes >= 60 && minutes % 60 === 0
    ? `${minutes / 60} سا`
    : minutes > 60 ? `${Math.floor(minutes / 60)} سا و${minutes % 60} د` : `${minutes} د`;
}

export default function TimetableViewer({
  slots,
  initialDay,
  currentTime,
  gradeName,
}: {
  slots: TimetableSlot[];
  initialDay: number;
  currentTime: string;
  gradeName: string;
}) {
  const [view, setView] = useState<'daily' | 'weekly'>('daily');
  const [day, setDay] = useState(initialDay >= 0 && initialDay <= 4 ? initialDay : 0);
  const weeklyMinutes = slots.reduce((total, slot) => total + minutesBetween(slot.start_time, slot.end_time), 0);
  const totalHours = Number((weeklyMinutes / 60).toFixed(1));
  const daySlots = slots.filter(slot => slot.day_of_week === day);
  const showNow = day === initialDay;

  return (
    <section className="miraj-schedule" aria-labelledby="schedule-title">
      <div className="miraj-schedule-hero">
        <div>
          <span className="miraj-schedule-kicker"><CalendarDays size={18} /> برنامجي الأسبوعي</span>
          <h1 id="schedule-title">جدول استعمال الزمن</h1>
          <p>{gradeName} — مواعيد الحصص كما حفظتها في حسابك.</p>
        </div>
        <div className="miraj-schedule-actions">
          <Link href="/account#my-timetable" className="miraj-schedule-edit"><Edit3 size={17} /> تعديل الحصص</Link>
          <button type="button" className="miraj-schedule-print" onClick={() => window.print()}><Printer size={17} /> طباعة</button>
        </div>
      </div>

      <div className="miraj-schedule-stats" aria-label="ملخص الجدول">
        <div><strong>{slots.length}</strong><span>حصة أسبوعية</span></div>
        <div><strong>{totalHours}</strong><span>ساعة أسبوعيًا</span></div>
        <div><strong>{new Set(slots.map(slot => slot.day_of_week)).size}</strong><span>أيام بها حصص</span></div>
      </div>

      <div className="miraj-schedule-view-tabs" role="group" aria-label="طريقة عرض التوقيت">
        <button type="button" aria-pressed={view === 'daily'} className={view === 'daily' ? 'active' : ''} onClick={() => setView('daily')}>العرض اليومي</button>
        <button type="button" aria-pressed={view === 'weekly'} className={view === 'weekly' ? 'active' : ''} onClick={() => setView('weekly')}>العرض الأسبوعي</button>
      </div>

      {view === 'daily' ? (
        <>
          <nav className="miraj-schedule-days" aria-label="اختر اليوم">
            {WEEKDAYS.map((name, index) => (
              <button type="button" key={name} className={index === day ? 'active' : ''} aria-current={index === day ? 'date' : undefined} onClick={() => setDay(index)}>
                <span>{name}</span><small>{slots.filter(slot => slot.day_of_week === index).length} حصص</small>
              </button>
            ))}
          </nav>
          <div className="miraj-schedule-day-heading">
            <h2>حصص {WEEKDAYS[day]}</h2>
            <span>{durationLabel(daySlots.reduce((sum, slot) => sum + minutesBetween(slot.start_time, slot.end_time), 0))}</span>
          </div>
          {daySlots.length === 0 ? (
            <div className="miraj-schedule-empty">لا توجد حصص مسجلة لهذا اليوم. <Link href="/account#my-timetable">أضف حصصًا من حسابي</Link>.</div>
          ) : (
            <div className="miraj-schedule-day-list">
              {daySlots.map((slot, index) => {
                const subject = subjectFor(slot.note);
                const starts = timeOf(slot.start_time);
                const ends = timeOf(slot.end_time);
                const current = showNow && currentTime >= starts && currentTime < ends;
                const breakMinutes = index > 0 ? minutesBetween(daySlots[index - 1].end_time, slot.start_time) : 0;
                return (
                  <div key={slot.id}>
                    {breakMinutes > 0 && <div className="miraj-schedule-break"><Clock3 size={15} /> فترة توقف — {durationLabel(breakMinutes)}</div>}
                    <article className={`miraj-schedule-session subject-${subject.key}${current ? ' current' : ''}`}>
                      <div className="miraj-schedule-time"><bdi dir="ltr">{starts}</bdi><span>إلى</span><bdi dir="ltr">{ends}</bdi></div>
                      <div className="miraj-schedule-symbol"><BookOpen size={22} aria-hidden="true" /></div>
                      <div className="miraj-schedule-description">
                        <span>{subject.name} {current && <em>الحصة الحالية</em>}</span>
                        <h3>{slot.note || subject.name}</h3>
                        <small>{durationLabel(minutesBetween(slot.start_time, slot.end_time))}</small>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="miraj-schedule-week-list">
          {WEEKDAYS.map((weekday, index) => {
            const entries = slots.filter(slot => slot.day_of_week === index);
            return (
              <section key={weekday} className="miraj-schedule-week-day">
                <header><h2>{weekday}</h2><span>{entries.length} حصص</span></header>
                {entries.length === 0 ? <p>لا توجد حصص</p> :
                  <div className="miraj-schedule-week-sessions">
                    {entries.map(slot => {
                      const subject = subjectFor(slot.note);
                      return <div key={slot.id} className={`miraj-schedule-week-entry subject-${subject.key}`}>
                        <strong>{slot.note || subject.name}</strong>
                        <bdi dir="ltr">{timeOf(slot.start_time)} – {timeOf(slot.end_time)}</bdi>
                      </div>;
                    })}
                  </div>}
              </section>
            );
          })}
        </div>
      )}

      <div className="miraj-schedule-legend" aria-label="دليل ألوان المواد">
        {SUBJECTS.map(subject => <span key={subject.key} className={`subject-${subject.key}`}>{subject.name}</span>)}
      </div>
      <p className="miraj-schedule-hint">تظهر الحصص المسجلة فقط. زر «تعديل الحصص» يعيدك إلى محرر جدول مستواك الحالي.</p>
    </section>
  );
}
