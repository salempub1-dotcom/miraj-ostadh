import Link from 'next/link';
import { LogOut, UserRound } from 'lucide-react';
import { requireCompletedTeacherContext } from '@/lib/auth';
import { getCurriculumContext } from '@/lib/v1';
import { TeacherNav } from '@/components/teacher/TeacherNav';

export default async function TeacherLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { supabase, userId, context } = await requireCompletedTeacherContext();
  const [{ data: profile }, curriculumContext] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, full_name')
      .eq('id', userId)
      .single(),
    getCurriculumContext(supabase, context.curriculum_id),
  ]);

  const teacherName = profile?.display_name ?? profile?.full_name ?? 'الأستاذ';
  const gradeName = curriculumContext?.grade.name_ar ?? 'التعليم الابتدائي';
  const gradeCode = curriculumContext?.grade.code ?? 'ابتدائي';
  const subjectName = curriculumContext?.subject.name_ar ?? 'اللغة العربية';
  const academicYear = curriculumContext?.year.name ?? '2026–2027';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/today" className="brand">
          <div className="brand-mark">م</div>
          <div>
            <h1>معراج الأستاذ</h1>
            <p>مكتب الأستاذ الرقمي</p>
          </div>
        </Link>

        <div className="sidebar-teacher">
          <div className="avatar" aria-hidden="true"><UserRound size={18} /></div>
          <div>
            <strong><bdi>{teacherName}</bdi></strong>
            <span>{context.class_name || gradeName}</span>
          </div>
        </div>

        <TeacherNav />

        <div className="sidebar-footer">
          <strong><bdi dir="ltr">{gradeCode}</bdi> • {subjectName}</strong>
          <div>{gradeName}</div>
          <div>السنة الدراسية <bdi dir="ltr" className="ltr-isolate">{academicYear}</bdi></div>
          <form action="/auth/signout" method="post">
            <button className="signout-button" type="submit"><LogOut size={15} /> تسجيل الخروج</button>
          </form>
        </div>
      </aside>

      <main className="main">{children}</main>

      <TeacherNav mobile />
    </div>
  );
}
