import Link from 'next/link';
import { redirect } from 'next/navigation';
import { neonAuth } from '@/lib/neon/auth';
import { getTrialGrades } from '@/lib/neon/reference-data';

export const dynamic = 'force-dynamic';
export default async function NeonTest() {
 const { data:session } = await neonAuth.getSession();
 if (!session?.user) redirect('/neon-login');
 const result=await getTrialGrades();
 return <main style={{maxWidth:780,margin:'2rem auto',padding:20}}>
   <h1>Neon — اختبار المصادقة والبيانات</h1>
   <p>تم التحقق من جلسة Neon Auth. البيانات أدناه تُقرأ عبر JWT وRLS، وليس بصلاحيات مدير قاعدة البيانات.</p>
   {result.error ? <p role="alert">تعذر قراءة البيانات: {result.error}</p> :
    <ul>{result.grades.map(g=><li key={g.code}>{g.name_ar} ({g.code})</li>)}</ul>}
   <Link href="/neon-login">العودة لتسجيل الدخول</Link>
 </main>;
}
