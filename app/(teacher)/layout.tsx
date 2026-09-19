import Link from 'next/link';
import { BookOpen, CalendarDays, Home, Library, NotebookTabs, UserRound } from 'lucide-react';

const navItems = [
  { href: '/today', label: 'يومي', icon: Home },
  { href: '/planning', label: 'التخطيط', icon: CalendarDays },
  { href: '/resources', label: 'الموارد', icon: BookOpen },
  { href: '/library', label: 'مكتبتي', icon: Library },
  { href: '/journal', label: 'دفتري', icon: NotebookTabs },
];

export default function TeacherLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">م</div>
          <div>
            <h1>معراج الأستاذ</h1>
            <p>مكتب الأستاذ الرقمي</p>
          </div>
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
