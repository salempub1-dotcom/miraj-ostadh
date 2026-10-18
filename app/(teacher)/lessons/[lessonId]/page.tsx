import Link from 'next/link';
import { ArrowRight, BookOpenText, ClipboardCheck, FileText, Layers3, Sparkles } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireCompletedTeacherContext } from '@/lib/auth';

const tabs = [
  { key: 'plan', label: 'المذكرة', icon: FileText },
  { key: 'text', label: 'النص', icon: BookOpenText },
  { key: 'resources', label: 'الوسائل', icon: Layers3 },
  { key: 'activities', label: 'الأنشطة', icon: Sparkles },
  { key: 'assessment', label: 'التقويم', icon: ClipboardCheck },
  { key: 'remediation', label: 'المعالجة', icon: Sparkles },
];

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { lessonId } = await params;
  const { tab = 'plan' } = await searchParams;
  const { supabase, context } = await requireCompletedTeacherContext();

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, week_id, domain_id, title, lesson_number, duration_minutes, status')
    .eq('id', lessonId)
    .maybeSingle();

  if (!lesson || lesson.status !== 'published') notFound();

  const { data: week } = await supabase
    .from('weeks')
    .select('id, unit_id, number, title')
    .eq('id', lesson.week_id)
    .maybeSingle();

  if (!week) notFound();

  const { data: unit } = await supabase
    .from('units')
    .select('id, curriculum_id, title')
    .eq('id', week.unit_id)
    .maybeSingle();

  if (!unit || unit.curriculum_id !== context.curriculum_id) notFound();

  const [{ data: domain }, { data: plan }] = await Promise.all([
    lesson.domain_id
      ? supabase.from('domains').select('name_ar').eq('id', lesson.domain_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('lesson_plans')
      .select('id, learning_objectives, teaching_materials, performance_indicators')
      .eq('lesson_id', lesson.id)
      .maybeSingle(),
  ]);

  const [{ data: relatedLinks }, { data: lessonActivities }] = await Promise.all([
    supabase.from('lesson_resources')
      .select('resource_id,category,order_index,resources(id,title,description,resource_type,external_url,status)')
      .eq('lesson_id', lesson.id)
      .order('order_index'),
    supabase.from('lesson_activities')
      .select('id,title,instructions,activity_type')
      .eq('lesson_id', lesson.id).order('order_index'),
  ]);

  type RelatedResource = { id:string; title:string; description:string|null; resource_type:string; external_url:string|null; status:string };
  const linkedResources = (relatedLinks ?? []).flatMap((link) => {
    const resource = link.resources as unknown as RelatedResource | RelatedResource[] | null;
    const item = Array.isArray(resource) ? resource[0] : resource;
    return item?.status === 'published' ? [item] : [];
  });

  const activeTab = tabs.some((item) => item.key === tab) ? tab : 'plan';

  return (
    <div className="lesson-workspace">
      <div className="lesson-workspace-head">
        <Link href="/today" className="text-link"><ArrowRight size={16} /> العودة إلى يومي</Link>
        <div className="lesson-breadcrumb">{unit.title} • الأسبوع {week.number}</div>
        <h1>{lesson.title}</h1>
        <p>{domain?.name_ar ?? 'اللغة العربية'} • {lesson.duration_minutes} دقيقة</p>
      </div>

      <nav className="lesson-tabs" aria-label="أقسام تحضير الدرس">
        {tabs.map(({ key, label, icon: Icon }) => (
          <Link key={key} href={`/lessons/${lesson.id}?tab=${key}`} className={activeTab === key ? 'active' : undefined}>
            <Icon size={17} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <section className="card lesson-tab-panel">
        {activeTab === 'plan' ? (
          <>
            <span className="section-kicker">المذكرة الرسمية</span>
            <h2>تحضير الحصة</h2>
            {plan ? (
              <div className="lesson-plan-summary">
                <div><strong>أهداف التعلم</strong><p>{plan.learning_objectives || 'لم تضاف بعد.'}</p></div>
                <div><strong>مؤشرات الأداء</strong><p>{plan.performance_indicators || 'لم تضاف بعد.'}</p></div>
                <div><strong>الوسائل</strong><p>{plan.teaching_materials || 'لم تضاف بعد.'}</p></div>
              </div>
            ) : (
              <div className="empty-state"><strong>مذكرة هذا الدرس قيد الإعداد.</strong><span>سيظهر المحتوى المنظم هنا فور نشره.</span></div>
            )}
          </>
        ) : activeTab === 'resources' ? (
          linkedResources.length > 0 ? (
            <div className="miraj-resource-grid">
              {linkedResources.map((resource) => (
                <article key={resource.id} className="miraj-resource-card">
                  <div className="miraj-resource-card-body">
                    <h2>{resource.title}</h2>
                    <p>{resource.description || 'مورد مرفق بهذا الدرس'}</p>
                  </div>
                  {resource.external_url?.startsWith('https://') ? (
                    <a href={resource.external_url} target="_blank" rel="noopener noreferrer" className="miraj-resource-open">معاينة المورد</a>
                  ) : <span className="miraj-resource-card-meta">المورد متاح داخل مكتبة المنصة</span>}
                </article>
              ))}
            </div>
          ) : <div className="empty-state"><strong>لا توجد وسائل منشورة لهذا الدرس بعد.</strong><span>سيتم ربط الوسائل التعليمية بعد مراجعتها.</span></div>
        ) : activeTab === 'activities' ? (
          (lessonActivities ?? []).length > 0 ? (
            <div className="miraj-resource-grid">
              {(lessonActivities ?? []).map((activity) => (
                <article key={activity.id} className="miraj-resource-card">
                  <div className="miraj-resource-card-body"><h2>{activity.title}</h2><p>{activity.instructions || 'نشاط مرتبط بالدرس'}</p></div>
                </article>
              ))}
            </div>
          ) : <div className="empty-state"><strong>لا توجد أنشطة مضافة بعد.</strong></div>
        ) : (
          <div className="empty-state">
            <strong>قسم {tabs.find((item) => item.key === activeTab)?.label} جاهز للربط بالمحتوى.</strong>
            <span>سنملؤه عند إدخال محتوى البرنامج الرسمي.</span>
          </div>
        )}
      </section>
    </div>
  );
}
