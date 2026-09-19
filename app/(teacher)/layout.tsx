import Link from 'next/link';
import { BookOpen, CalendarDays, Home, Library, LogOut, NotebookTabs, UserRound } from 'lucide-react';
import { requireCompletedTeacherContext } from '@/lib/auth';

const navItems = [
  { href: '/today', label: 'يومي', icon: Home },
  { href: '/planning', label: 'التخطيط', icon: CalendarDays },
  { href: '/resources', label: 'الموارد', icon: BookOpen },
  { href: '/library', label: 'مكتبتي', icon: Library },
  { href: '/journal', label: 'دفتري', icon: NotebookTabs },
];

export default async function TeacherLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { supabase, userId, context } = await requireCompletedTeacherContext();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, full_name')
    .eq('id', userId)
    .single();

  const teacherName = profile?.display_name ?? profile?.full_name ?? 'الأستاذ';

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
          <div className="avatar">👩🏻‍🏫</div>
          <div><strong>{teacherName}</strong><span>{context.class_name || 'السنة الثالثة ابتدائي'}</span></div>
        </div>

        <nav className="nav" aria-label="التنقل الرئيسي">
          {navItems.map(({ href, label, icon: Icon }, index) => (
            <Link key={href} href={href} className={index === 0 ? 'active' : ''}>
              <Icon size={19} />
              <span>{label}</span>
            </Link>
          ))}
          <Link href="/account">
            <UserRound size={19} />
            <span>حسابي</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <strong>3AP • اللغة العربية</strong>
          <div>السنة الدراسية 2026–2027</div>
          <form action="/auth/signout" method="post">
            <button className="signout-button" type="submit"><LogOut size={16} /> تسجيل الخروج</button>
          </form>
        </div>
      </aside>

      <main className="main">{children}</main>

      <nav className="mobile-nav" aria-label="التنقل على الهاتف">
        <Link href="/today" className="active"><Home size={19} /><span>يومي</span></Link>
        <Link href="/planning"><CalendarDays size={19} /><span>التخطيط</span></Link>
        <Link href="/library"><Library size={19} /><span>مكتبتي</span></Link>
        <Link href="/journal"><NotebookTabs size={19} /><span>دفتري</span></Link>
        <Link href="/account"><UserRound size={19} /><span>حسابي</span></Link>
      </nav>
    </div>
  );
}
