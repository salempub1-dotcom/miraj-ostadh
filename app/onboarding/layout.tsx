import Link from 'next/link';
import { requireUser } from '@/lib/auth';

export default async function OnboardingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireUser();

  return (
    <main className="onboarding-shell">
      <header className="onboarding-header">
        <Link href="/" className="auth-brand compact-brand">
          <span className="brand-mark">م</span>
          <span>
            <strong>معراج الأستاذ</strong>
            <small>إعداد مكتبك الرقمي</small>
          </span>
        </Link>
        <span className="onboarding-badge">3AP • اللغة العربية</span>
      </header>
      <section className="onboarding-content">{children}</section>
    </main>
  );
}
