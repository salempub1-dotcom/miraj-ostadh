import Link from 'next/link';
import { loginAction } from './actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="auth-card">
      <div className="auth-card-head">
        <span className="eyebrow">مرحبًا بعودتك</span>
        <h2>تسجيل الدخول</h2>
        <p>ادخل إلى مكتبك لمتابعة يومك وتحضير حصصك.</p>
      </div>

      {error ? <div className="form-alert error">{error}</div> : null}

      <form action={loginAction} className="form-stack">
        <label>
          <span>البريد الإلكتروني</span>
          <input name="email" type="email" autoComplete="email" required placeholder="teacher@example.com" />
        </label>
        <label>
          <span>كلمة المرور</span>
          <input name="password" type="password" autoComplete="current-password" required minLength={8} placeholder="••••••••" />
        </label>
        <button className="primary-btn wide" type="submit">دخول إلى معراج الأستاذ</button>
      </form>

      <p className="auth-switch">ليس لديك حساب؟ <Link href="/register">إنشاء حساب جديد</Link></p>
    </div>
  );
}
