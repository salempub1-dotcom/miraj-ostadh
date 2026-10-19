import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, Save } from 'lucide-react';
import { requireCompletedTeacherContext } from '@/lib/auth';
import { getCurriculumContext } from '@/lib/v1';
import { saveProfessionalCard } from './actions';

const textFields = [
  { key:'teacher_name',label:'اسم الأستاذ ولقبه',max:120 },
  { key:'directorate',label:'مديرية التربية',max:150 },
  { key:'school_name',label:'المؤسسة التعليمية',max:180 },
  { key:'academic_qualification',label:'المؤهلات العلمية',max:600 },
  { key:'professional_qualification',label:'المؤهلات والخبرة المهنية',max:600 },
  { key:'promotion_notes',label:'الترقية والمسار المهني',max:1500 },
  { key:'inspector_visit_notes',label:'التفتيش والزيارات التربوية',max:1500 },
] as const;

export default async function TeacherProfessionalProfile({
  searchParams,
}: { searchParams: Promise<{saved?:string;error?:string}> }) {
  const { supabase, context, userId } = await requireCompletedTeacherContext();
  const params=await searchParams;
  const [{data:card,error:cardError},{data:profile},curriculum] = await Promise.all([
    supabase.from('teacher_professional_cards').select('*').eq('user_id',userId).maybeSingle(),
    supabase.from('profiles').select('full_name,display_name,school_name').eq('id',userId).maybeSingle(),
    getCurriculumContext(supabase,context.curriculum_id),
  ]);
  if (cardError) return <div role="alert" className="miraj-journal-error">تعذر تحميل البطاقة المهنية. تحقق من تفعيل قاعدة البيانات.</div>;
  const defaults:Record<string,string> = {
    teacher_name:profile?.display_name??profile?.full_name??'',
    school_name:profile?.school_name??'',
  };
  const errorText=params.error==='date'?'يرجى إدخال تاريخ صحيح.':
    params.error==='length'?'النص طويل جدًا في أحد الحقول.':
    params.error==='save'?'تعذر حفظ البطاقة. لم تُغيّر بياناتك.':null;
  return <section className="miraj-journal miraj-professional">
    <header className="miraj-journal-heading">
      <div>
        <span className="miraj-journal-eyebrow"><BriefcaseBusiness size={18}/> دفتر الأستاذ الرقمي</span>
        <h1>بطاقتي الشخصية والمهنية</h1>
        <p>مستوحاة من أقسام الدفتر اليومي الورقي. يمكنك تحديثها وطباعتها متى شئت.</p>
      </div>
      <Link href="/journal" className="miraj-professional-back"><ArrowRight size={17}/> العودة إلى دفتري</Link>
    </header>
    {params.saved==='1'&&<p className="miraj-journal-message" role="status">حُفظت بطاقتك المهنية بنجاح.</p>}
    {errorText&&<p className="miraj-journal-message error" role="alert">{errorText}</p>}
    <form action={saveProfessionalCard} className="miraj-professional-form">
      <div className="miraj-professional-group">
        <h2>المعلومات الشخصية والإدارية</h2>
        <p>هذه البيانات تخص حسابك فقط، ولا تُنشر ضمن مكتبة الأساتذة.</p>
        <div className="miraj-professional-fields">
          {textFields.slice(0,3).map(f=><label key={f.key}>{f.label}
            <input name={f.key} maxLength={f.max} defaultValue={card?.[f.key]??defaults[f.key]??''} />
          </label>)}
          <div className="miraj-professional-fixed">المستوى الحالي: <strong>{curriculum?.grade.name_ar??'—'}</strong> — القسم: <strong>{context.class_name??'—'}</strong>
            <p>تعديل المستوى والقسم يتم من <Link href="/account#change-grade">حسابي</Link> للحفاظ على ارتباط الدروس.</p>
          </div>
        </div>
      </div>
      <div className="miraj-professional-group">
        <h2>المؤهلات والمسار المهني</h2>
        <div className="miraj-professional-fields">
          {textFields.slice(3,5).map(f=><label key={f.key}>{f.label}
            <textarea name={f.key} rows={3} maxLength={f.max} defaultValue={card?.[f.key]??''}/>
          </label>)}
          <label>تاريخ أول توظيف<input type="date" name="first_employment_date" defaultValue={card?.first_employment_date??''}/></label>
          <label>تاريخ التعيين<input type="date" name="appointment_date" defaultValue={card?.appointment_date??''}/></label>
        </div>
      </div>
      <div className="miraj-professional-group">
        <h2>التفتيش والترقية</h2>
        <div className="miraj-professional-fields">
          {textFields.slice(5).map(f=><label key={f.key}>{f.label}
            <textarea name={f.key} rows={3} maxLength={f.max} defaultValue={card?.[f.key]??''}/>
          </label>)}
        </div>
      </div>
      <div className="miraj-professional-actions"><button type="submit" className="miraj-journal-save"><Save size={18}/> حفظ البطاقة المهنية</button></div>
    </form>
  </section>;
}
