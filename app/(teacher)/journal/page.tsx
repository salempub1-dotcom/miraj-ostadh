import Link from 'next/link';
import { ArrowUpLeft, BookOpenCheck, CalendarDays, GraduationCap, NotebookTabs, School } from 'lucide-react';
import { requireCompletedTeacherContext } from '@/lib/auth';
import { getCurriculumContext } from '@/lib/v1';
import { JournalSectionNav, sections } from './JournalSectionNav';

export default async function JournalHome() {
 const {supabase,context,userId}=await requireCompletedTeacherContext();
 const [{data:profile},{data:card},curriculum,{count:pupils},{count:days},{count:records}] = await Promise.all([
  supabase.from('profiles').select('display_name,full_name,school_name').eq('id',userId).maybeSingle(),
  supabase.from('teacher_professional_cards').select('teacher_name,school_name').eq('user_id',userId).maybeSingle(),
  getCurriculumContext(supabase,context.curriculum_id),
  supabase.from('teacher_class_pupils').select('id',{head:true,count:'exact'}).eq('teacher_context_id',context.id),
  supabase.from('daily_journals').select('id',{head:true,count:'exact'}).eq('teacher_context_id',context.id),
  supabase.from('teacher_register_records').select('id',{head:true,count:'exact'}).eq('teacher_context_id',context.id),
 ]);
 const name=card?.teacher_name??profile?.display_name??profile?.full_name??'الأستاذ';
 const school=card?.school_name??profile?.school_name??'مؤسستك التعليمية';
 return <main className="register-home">
  <header className="register-home-hero">
   <div><span className="register-eyebrow"><NotebookTabs size={18}/> دفتر الأستاذ الرقمي</span>
   <h1>دفتري</h1><p>ملفاتك المهنية والتربوية في مكان واحد، قابلة للتحرير والحفظ والطباعة.</p>
   <div className="register-identity"><span><GraduationCap size={16}/>{name}</span><span><School size={16}/>{school}</span><span><BookOpenCheck size={16}/>{curriculum?.grade.name_ar??'التعليم الابتدائي'} — {context.class_name||'القسم الحالي'}</span></div>
   </div><div className="register-hero-mark"><NotebookTabs size={43}/></div>
  </header>
  <JournalSectionNav active="/journal"/>
  <div className="register-summary">
    <div><strong>{days??0}</strong><span>دفاتر أيام محفوظة</span></div>
    <div><strong>{pupils??0}</strong><span>تلاميذ مسجلون</span></div>
    <div><strong>{records??0}</strong><span>مواعيد وسجلات</span></div>
  </div>
  <div className="register-home-heading"><h2>أقسام الدفتر</h2><span>اختر القسم الذي تريد تنظيمه</span></div>
  <div className="register-home-grid">
   {sections.slice(1).map(({href,label,icon:Icon},i)=><Link href={href} className={'register-card register-card-'+i} key={href}>
    <div className="register-card-icon"><Icon size={25}/></div><div><h3>{label}</h3><p>{[
       'بيانات الأستاذ والمؤهلات والمسار المهني',
       'حِصص اليوم وأهدافها ومحتواها والأنشطة',
       'القائمة الاسمية والملاحظات لكل تلميذ',
       'العطل والمناسبات ومواعيد السنة الدراسية',
       'زيارات المفتش والتكوين والتربصات',
      ][i]}</p></div><ArrowUpLeft className="register-card-arrow" size={20}/>
   </Link>)}
  </div>
  <div className="register-home-footer"><CalendarDays size={18}/>
   <p>تُعرض الرزنامة التي تدخلها أنت فقط. لا نعتمد تواريخ العطل الموجودة في ملف قديم على أنها رزنامة رسمية لسنة 2026–2027.</p>
   <Link href="/schedule">فتح جدولي</Link>
  </div>
 </main>;
}
