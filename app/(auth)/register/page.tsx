import Link from 'next/link';
import { registerAction } from './actions';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="auth-card">
      <div className="auth-card-head">
        <span className="eyebrow">ابدأ إعداد مكتبك</span>
        <h2>إنشاء حساب أستاذ</h2>
        <p>سنحتاج بعد التسجيل إلى خطوات قليلة فقط لإعداد المستوى وجدول الحصص.</p>
      </div>

      {error ? <div className="form-alert error">{error}</div> : null}

      <form action={registerAction} className="form-stack">
        <label>
          <span>الاسم واللقب</span>
          <input name="full_name" type="text" autoComplete="name" required minLength={2} placeholder="مثال: سارة محمد" />
        </label>
        <label>
          <span>البريد الإلكتروني</span>
          <input name="email" type="email" autoComplete="email" required placeholder="teacher@example.com" />
        </label>
        <label>
          <span>كلمة المرور</span>
          <input name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="8 أحرف على الأقل" />
        </label>
        <button className="primary-btn wide" type="submit">إنشاء الحساب</button>
      </form>

      <p className="auth-switch">لديك حساب بالفعل؟ <Link href="/login">تسجيل الدخول</Link></p>
    </div>
  );
}
