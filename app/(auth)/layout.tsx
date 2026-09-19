import Link from 'next/link';

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <Link href="/" className="auth-brand">
          <span className="brand-mark">م</span>
          <span>
            <strong>معراج الأستاذ</strong>
            <small>مكتب الأستاذ الرقمي</small>
          </span>
        </Link>
        <div className="auth-brand-copy">
          <span className="eyebrow">للأستاذ الجزائري</span>
          <h1>تحضيرك اليومي، مرتب وفي مكان واحد.</h1>
          <p>نبدأ بالسنة الثالثة ابتدائي في اللغة العربية، ثم نتوسع خطوة بخطوة.</p>
        </div>
      </section>
      <section className="auth-content">{children}</section>
    </main>
  );
}
