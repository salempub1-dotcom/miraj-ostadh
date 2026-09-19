'use client';

import Link from 'next/link';
import { BookOpen, CalendarDays, Home, Library, NotebookTabs, UserRound, type LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string; icon: LucideIcon };

const desktopItems: NavItem[] = [
  { href: '/today', label: 'يومي', icon: Home },
  { href: '/planning', label: 'التخطيط', icon: CalendarDays },
  { href: '/resources', label: 'الموارد', icon: BookOpen },
  { href: '/library', label: 'مكتبتي', icon: Library },
  { href: '/journal', label: 'دفتري', icon: NotebookTabs },
  { href: '/account', label: 'حسابي', icon: UserRound },
];

const mobileItems = desktopItems.filter((item) => ['/today', '/planning', '/library', '/journal', '/account'].includes(item.href));

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TeacherNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const items = mobile ? mobileItems : desktopItems;

  return (
    <nav className={mobile ? 'mobile-nav' : 'nav'} aria-label={mobile ? 'التنقل على الهاتف' : 'التنقل الرئيسي'}>
      {items.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={isActive(pathname, href) ? 'active' : undefined}>
          <Icon size={mobile ? 19 : 20} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
