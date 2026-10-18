import Link from 'next/link';
import { BookOpen, FileText, Layers3, ExternalLink, Search, ShieldCheck } from 'lucide-react';
import { requireCompletedTeacherContext } from '@/lib/auth';
import { getCurriculumContext } from '@/lib/v1';

type Resource = {
  id: string; title: string; description: string | null; resource_type: string;
  grade_code: string | null; subject_code: string | null;
  unit_number: number | null; lesson_number: number | null;
  external_url: string | null; status: string; review_status: string;
};

export default async function ResourcesPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; kind?: string }> }) {
  const { supabase, context } = await requireCompletedTeacherContext();
  const curriculum = await getCurriculumContext(supabase, context.curriculum_id);
  const gradeCode = curriculum?.grade.code ?? '1AP';
  const { q = '', kind = '' } = await searchParams;
  let query = supabase.from('resources')
    .select('id,title,description,resource_type,grade_code,subject_code,unit_number,lesson_number,external_url,status,review_status')
    .eq('grade_code', gradeCode)
    .order('unit_number', { ascending: true, nullsFirst: false })
    .order('lesson_number', { ascending: true, nullsFirst: false })
    .limit(150);
  if (kind && ['pdf','worksheet','flashcard','poster','image','audio','document','other'].includes(kind)) query = query.eq('resource_type', kind);
  if (q.trim()) query = query.ilike('title', `%${q.trim().replace(/[%_,]/g, '')}%`);
  const { data, error } = await query;
  const resources = (data ?? []) as Resource[];
  const published = resources.filter(r => r.status === 'published' && r.review_status === 'verified');
  const inReview = resources.filter(r => r.status !== 'published' || r.review_status !== 'verified');
  const subjectLabels: Record<string,string> = { AR:'اللغة العربية', MATH:'الرياضيات', ISLAMIC:'التربية الإسلامية' };

  return <div className="miraj-resource-page">
    <header className="miraj-resource-hero">
      <div className="miraj-resource-hero-icon"><BookOpen size={26}/></div>
      <div><span className="section-kicker">مكتبة معراج الأستاذ</span>
        <h1>الموارد التعليمية</h1>
        <p>{curriculum?.grade.name_ar ?? 'التعليم الابتدائي'} — المذكرات والأنشطة والوسائل مرتبطة بالحصة المناسبة.</p></div>
    </header>
    <form method="get" className="miraj-resource-filters">
      <label><Search size={18}/><span className="sr-only">البحث في الموارد</span>
        <input name="q" type="search" placeholder="ابحث عن مذكرة أو نشاط..." defaultValue={q} /></label>
      <select name="kind" defaultValue={kind} aria-label="نوع المورد">
        <option value="">كل أنواع الملفات</option>
        <option value="pdf">مذكرات وملفات PDF</option><option value="worksheet">أوراق العمل</option>
        <option value="flashcard">بطاقات تعليمية</option><option value="poster">معلقات</option>
        <option value="image">صور</option><option value="audio">صوتيات</option><option value="document">مستندات</option>
      </select><button type="submit">بحث</button>
    </form>
    {error && <p role="alert" className="miraj-resource-notice">تعذر تحميل الموارد، تحقق من الاتصال أو تحديث قاعدة البيانات.</p>}
    {!error && !resources.length && <div className="card miraj-resource-empty"><Layers3 size={30}/><h2>لا توجد موارد مطابقة بعد</h2><p>ستظهر الملفات هنا بعد فهرستها ومراجعتها.</p></div>}
    {published.length > 0 && <section><h2 className="miraj-resource-section-title"><ShieldCheck size={19}/> الموارد المعتمدة ({published.length})</h2>
      <div className="miraj-resource-grid">{published.map(r => <article className="miraj-resource-item" key={r.id}>
        <FileText size={23} /><h3>{r.title}</h3><p>{r.description}</p>
        <span>{subjectLabels[r.subject_code ?? ''] ?? r.subject_code ?? 'مورد عام'} • المقطع {r.unit_number ?? '—'} • الدرس {r.lesson_number ?? '—'}</span>
        {r.external_url ? <a href={r.external_url} target="_blank" rel="noopener noreferrer">عرض الملف <ExternalLink size={15}/></a> : <span>الملف قيد الإعداد</span>}
      </article>)}</div></section>}
    {inReview.length > 0 && <section><h2 className="miraj-resource-section-title">موارد بانتظار المراجعة ({inReview.length})</h2>
      <p className="miraj-resource-hint">هذه المسودات ظاهرة للمشرفين المخولين فقط، ولا تُعد موارد منشورة.</p>
      <div className="miraj-resource-grid">{inReview.map(r => <article className="miraj-resource-item" key={r.id}>
        <FileText size={23}/><h3>{r.title}</h3><p>{r.description}</p>
        <span>{subjectLabels[r.subject_code ?? ''] ?? 'مورد تعليمي'} • المقطع {r.unit_number ?? '—'} • الدرس {r.lesson_number ?? '—'}</span>
        <strong className="miraj-resource-draft">مسودة — تحتاج مراجعة</strong>
      </article>)}</div></section>}
    <p className="miraj-resource-footer"><Link href="/planning">العودة إلى التخطيط</Link></p>
  </div>;
}
