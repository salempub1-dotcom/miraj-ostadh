import Link from 'next/link';
import { BookOpen, FileText, Images, LibraryBig, Search, Shapes } from 'lucide-react';
import { requireCompletedTeacherContext } from '@/lib/auth';
import { getCurriculumContext } from '@/lib/v1';

const categories = [
  { key: 'lesson_plan', label: 'المذكرات', icon: BookOpen },
  { key: 'worksheet', label: 'أوراق العمل', icon: FileText },
  { key: 'visual_aid', label: 'الوسائل التعليمية', icon: Images },
  { key: 'game', label: 'الألعاب والأنشطة', icon: Shapes },
];

type IndexedResource = {
  id: string; title: string; description: string | null; resource_type: string;
  educational_category: string | null; external_url: string | null;
  storage_bucket: string | null; storage_path: string | null;
  sequence_number: number | null; lesson_number: number | null;
};

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { supabase, context } = await requireCompletedTeacherContext();
  const curriculum = await getCurriculumContext(supabase, context.curriculum_id);
  const { q = '', category = '' } = await searchParams;
  const search = q.trim().slice(0, 80);
  const gradeCode = curriculum?.grade.code ?? '';
  const subjectCode = curriculum?.subject.code ?? '';

  // RLS limits ordinary teachers to published resources. Draft imports never appear here.
  let query = supabase.from('resources')
    .select('id,title,description,resource_type,educational_category,external_url,storage_bucket,storage_path,sequence_number,lesson_number')
    .eq('status', 'published')
    .eq('curriculum_grade_code', gradeCode)
    .eq('curriculum_subject_code', subjectCode)
    .order('sequence_number', { ascending: true })
    .order('lesson_number', { ascending: true })
    .limit(100);
  if (category && categories.some(x => x.key === category)) {
    query = query.eq('educational_category', category);
  }
  if (search) query = query.ilike('title', '%' + search.replace(/[%,()]/g, '') + '%');
  const { data, error } = await query;
  const resources = (data ?? []) as IndexedResource[];

  return (
    <div className="miraj-resource-page">
      <header className="miraj-resource-header">
        <div className="miraj-resource-eyebrow"><LibraryBig size={17}/> مكتبة المعراج التعليمية</div>
        <h1>الموارد التعليمية</h1>
        <p>المذكرات والأنشطة والوسائل المرتبطة بدروس {curriculum?.grade.name_ar ?? 'التعليم الابتدائي'} — {curriculum?.subject.name_ar ?? 'المواد الدراسية'}.</p>
      </header>
      <form className="miraj-resource-search" action="/resources">
        <Search size={19} aria-hidden="true"/>
        <input name="q" type="search" placeholder="ابحث عن مذكرة أو درس أو وسيلة..." defaultValue={search} aria-label="بحث في الموارد التعليمية"/>
        {category ? <input type="hidden" name="category" value={category}/> : null}
        <button type="submit">بحث</button>
      </form>
      <nav className="miraj-resource-types" aria-label="تصنيف الموارد">
        <Link className={!category ? 'active' : ''} href="/resources">الكل</Link>
        {categories.map(({key,label,icon:Icon}) => (
          <Link className={category===key?'active':''} key={key} href={`/resources?category=${key}`}>
            <Icon size={17}/>{label}
          </Link>
        ))}
      </nav>
      {error ? <div className="miraj-resource-empty" role="alert">تعذر تحميل الموارد حاليًا. يرجى إعادة المحاولة.</div> : null}
      {!error && resources.length===0 ? (
        <div className="miraj-resource-empty">
          <BookOpen size={32}/>
          <h2>لا توجد موارد منشورة لهذا الاختيار بعد</h2>
          <p>يجري تنظيم المذكرات ومراجعتها قبل إتاحتها للأساتذة. لن نعرض ملفات غير معتمدة.</p>
        </div>
      ) : (
        <div className="miraj-resource-grid">
          {resources.map(resource => (
            <article key={resource.id} className="miraj-resource-card">
              <div className="miraj-resource-card-icon"><FileText size={24}/></div>
              <div className="miraj-resource-card-body">
                <span className="miraj-resource-card-meta">المقطع {resource.sequence_number ?? '—'} · الدرس {resource.lesson_number ?? '—'}</span>
                <h2>{resource.title}</h2>
                {resource.description ? <p>{resource.description}</p> : null}
              </div>
              {resource.external_url?.startsWith('https://') ? (
                <a href={resource.external_url} target="_blank" rel="noopener noreferrer" className="miraj-resource-open">معاينة الملف</a>
              ) : (
                <span className="miraj-resource-card-meta">متاح من مكتبة الدرس</span>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
