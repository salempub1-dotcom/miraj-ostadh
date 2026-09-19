import { Mail, MapPin, School, UserRound } from 'lucide-react';
import { requireCompletedTeacherContext } from '@/lib/auth';
import { getCurriculumContext } from '@/lib/v1';

export default async function AccountPage() {
  const { supabase, userId, context } = await requireCompletedTeacherContext();
  const [{ data: profile }, { data: timetable }, curriculumContext] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, display_name, email, province, school_name')
      .eq('id', userId)
      .single(),
    supabase
      .from('teacher_timetables')
      .select('id')
      .eq('teacher_context_id', context.id)
      .eq('is_active', true)
      .maybeSingle(),
    getCurriculumContext(supabase, context.curriculum_id),
  ]);

  const { count } = timetable
    ? await supabase.from('timetable_slots').select('id', { count: 'exact', head: true }).eq('timetable_id', timetable.id)
    : { count: 0 };

  const gradeCode = curriculumContext?.grade.code ?? 'ابتدائي';
  const gradeName = curriculumContext?.grade.name_ar ?? 'التعليم الابتدائي';
  const subjectName = curriculumContext?.subject.name_ar ?? 'اللغة العربية';
  const academicYear = curriculumContext?.year.name ?? '2026–2027';

  return (
    <section className="account-grid">
      <div className="card account-hero">
        <div className="large-avatar">👨🏻‍🏫</div>
        <div>
          <div className="small">حساب الأستاذ</div>
          <h2>{profile?.display_name ?? profile?.full_name ?? 'الأستاذ'}</h2>
          <p>{gradeCode} • {subjectName} • {academicYear}</p>
          <div className="small">{gradeName}</div>
        </div>
      </div>

      <div className="card details-list">
        <div><UserRound size={18} /><span><strong>المستوى والقسم</strong>{context.class_name || gradeName}</span></div>
        <div><Mail size={18} /><span><strong>البريد الإلكتروني</strong>{profile?.email || '—'}</span></div>
        <div><MapPin size={18} /><span><strong>الولاية</strong>{profile?.province || 'غير محددة'}</span></div>
        <div><School size={18} /><span><strong>المؤسسة</strong>{profile?.school_name || 'غير محددة'}</span></div>
        <div><span className="detail-count">{count ?? 0}</span><span><strong>جدول استعمال الزمن</strong>حصة أسبوعية مسجلة</span></div>
      </div>

      <form action="/auth/signout" method="post" className="card">
        <button className="secondary-btn wide" type="submit">تسجيل الخروج</button>
      </form>
    </section>
  );
}
