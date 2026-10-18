'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, FileText, Plus, Printer, Save, Trash2 } from 'lucide-react';
import { saveDailyJournalAction } from './actions';

export type JournalEntry = {
  key: string;
  start: string;
  end: string;
  subject: string;
  title: string;
  activities: string;
};

function newEntry(index: number): JournalEntry {
  return { key: `added-${Date.now()}-${index}`, start: '08:00', end: '08:30', subject: 'اللغة العربية', title: '', activities: '' };
}

const subjectChoices = ['اللغة العربية','الرياضيات','التربية الإسلامية','التربية البدنية','التربية الفنية'];

export default function JournalEditor({
  date, gradeName, teacherName, schoolName, className,
  initialEntries, initialNote, saved, error,
}: {
  date: string;
  gradeName: string;
  teacherName: string;
  schoolName: string;
  className: string | null;
  initialEntries: JournalEntry[];
  initialNote: string;
  saved: boolean;
  error: string | null;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [note, setNote] = useState(initialNote);
  function update(key: string, field: keyof Omit<JournalEntry, 'key'>, value: string) {
    setEntries(prev => prev.map(entry => entry.key === key ? { ...entry, [field]: value } : entry));
  }
  const dayLabel = new Intl.DateTimeFormat('ar-DZ', { dateStyle: 'full', timeZone: 'Africa/Algiers' })
    .format(new Date(date + 'T12:00:00Z'));
  const payload = JSON.stringify(entries.map(({ start, end, subject, title, activities }) =>
    ({ start, end, subject, title, activities })));

  return <section className="miraj-journal">
    <header className="miraj-journal-heading">
      <div><span className="miraj-journal-eyebrow"><FileText size={17} /> دفتر الأستاذ الرقمي</span>
        <h1>الدفتر اليومي</h1>
        <p>تُجلب الحصص من جدول مستواك تلقائيًا، ويمكنك كتابة عنوان كل درس وأنشطته.</p>
      </div>
      <div className="miraj-journal-heading-actions">
        <Link href="/journal/profile">بطاقتي المهنية</Link>
        <Link href="/schedule">جدولي</Link>
        <button type="button" onClick={() => window.print()}><Printer size={17}/> طباعة A4</button>
      </div>
    </header>
    <div className="miraj-journal-switch">
      <form action="/journal" method="get">
        <label htmlFor="journal-date"><CalendarDays size={17} /> تاريخ الدفتر</label>
        <input id="journal-date" name="date" type="date" required defaultValue={date}/>
        <button type="submit">عرض اليوم</button>
      </form>
      <strong>{dayLabel}</strong>
    </div>
    {saved && <div className="miraj-journal-message" role="status">تم حفظ دفتر هذا اليوم بنجاح.</div>}
    {error && <div className="miraj-journal-message error" role="alert">{error}</div>}
    <form action={saveDailyJournalAction} className="miraj-journal-form">
      <input type="hidden" name="date" value={date}/>
      <input type="hidden" name="entries" value={payload}/>
      <div className="miraj-journal-paper">
        <div className="miraj-journal-print-head">
          <div><strong>الجمهورية الجزائرية الديمقراطية الشعبية</strong><span>وزارة التربية الوطنية</span></div>
          <div><strong>الدفتر اليومي</strong><span>السنة الدراسية 2026/2027</span></div>
        </div>
        <div className="miraj-journal-paper-meta">
          <span>الأستاذ: <strong>{teacherName}</strong></span>
          <span>المستوى: <strong>{gradeName}</strong></span>
          <span>القسم: <strong>{className || '—'}</strong></span>
          <span>المؤسسة: <strong>{schoolName || '—'}</strong></span>
          <span>التاريخ: <strong>{dayLabel}</strong></span>
        </div>
        {entries.length === 0 ? <div className="miraj-journal-empty">
          لا توجد حصص في التوقيت لهذا اليوم. يمكنك إضافة حصة يدويًا أو اختيار تاريخ دراسي آخر.
        </div> : null}
        <div className="miraj-journal-entries">
          {entries.map((entry, index) => <article key={entry.key} className="miraj-journal-entry">
            <div className="miraj-journal-entry-index">{index + 1}</div>
            <div className="miraj-journal-entry-fields">
              <div className="miraj-journal-entry-grid">
                <label>البداية<input required type="time" value={entry.start}
                  onChange={e => update(entry.key,'start',e.target.value)}/></label>
                <label>النهاية<input required type="time" value={entry.end}
                  onChange={e => update(entry.key,'end',e.target.value)}/></label>
                <label>المادة<select value={entry.subject} onChange={e=>update(entry.key,'subject',e.target.value)}>
                  {subjectChoices.includes(entry.subject) ? null : <option value={entry.subject}>{entry.subject}</option>}
                  {subjectChoices.map(value=><option key={value} value={value}>{value}</option>)}
                </select></label>
              </div>
              <label>عنوان الدرس أو النشاط<input required type="text" maxLength={200}
                value={entry.title} onChange={e=>update(entry.key,'title',e.target.value)}/></label>
              <label>الأنشطة، مراحل الإنجاز أو الملاحظات<textarea rows={2} maxLength={2500}
                value={entry.activities} onChange={e=>update(entry.key,'activities',e.target.value)}
                placeholder="اكتب الأنشطة الأساسية للحصة..."/></label>
            </div>
            <button className="miraj-journal-delete" type="button" aria-label={`حذف الحصة ${index+1}`}
              onClick={()=>setEntries(prev=>prev.filter(item=>item.key!==entry.key))}><Trash2 size={17}/></button>
          </article>)}
        </div>
        <button className="miraj-journal-add" type="button" disabled={entries.length>=35}
          onClick={()=>setEntries(prev=>[...prev,newEntry(prev.length)])}><Plus size={17}/> إضافة حصة</button>
        <label className="miraj-journal-teacher-note">ملاحظات عامة لليوم
          <textarea name="teacher_note" rows={3} maxLength={2000} value={note}
            onChange={e=>setNote(e.target.value)} placeholder="ملاحظات الأستاذ حول سير اليوم الدراسي..."/>
        </label>
      </div>
      <div className="miraj-journal-save-bar">
        <span>الحفظ يخص اليوم المختار والمستوى الحالي فقط.</span>
        <button type="submit" className="miraj-journal-save"><Save size={18}/> حفظ الدفتر اليومي</button>
      </div>
    </form>
    <div className="miraj-journal-print-only">
      <h2>الدفتر اليومي — {dayLabel}</h2>
      <div className="miraj-journal-paper-meta">
        <span>الأستاذ: {teacherName}</span><span>المستوى: {gradeName}</span>
        <span>القسم: {className || '—'}</span><span>المؤسسة: {schoolName || '—'}</span>
      </div>
      <table>
        <thead><tr><th>التوقيت</th><th>المادة</th><th>الدرس / النشاط</th><th>الأنشطة والملاحظات</th></tr></thead>
        <tbody>{entries.map(entry=><tr key={entry.key}>
          <td dir="ltr">{entry.start} – {entry.end}</td><td>{entry.subject}</td><td>{entry.title}</td>
          <td style={{whiteSpace:'pre-wrap'}}>{entry.activities}</td>
        </tr>)}</tbody>
      </table>
      <p>ملاحظات الأستاذ: {note || '—'}</p>
    </div>
  </section>;
}
