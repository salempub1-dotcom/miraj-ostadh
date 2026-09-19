import { NotebookTabs } from 'lucide-react';

export default function JournalPage() {
  return (
    <section className="card page-placeholder">
      <NotebookTabs size={28} />
      <h2>الدفتر اليومي</h2>
      <p>سيُبنى دفتر اليوم تلقائيًا من جدول استعمال الزمن وتقدمك الدراسي. بنية قاعدة البيانات الخاصة به جاهزة.</p>
    </section>
  );
}
