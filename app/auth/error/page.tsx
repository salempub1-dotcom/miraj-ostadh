import Link from 'next/link';
import { CircleAlert } from 'lucide-react';

export default function AuthErrorPage() {
  return (
    <main className="standalone-message">
      <div className="auth-card centered-card">
        <div className="error-icon"><CircleAlert size={34} /></div>
        <h2>تعذر تأكيد الحساب</h2>
        <p>قد يكون رابط التأكيد منتهي الصلاحية أو تم استخدامه من قبل. جرّب تسجيل الدخول أو إنشاء الحساب مرة أخرى.</p>
        <Link className="primary-btn wide-link" href="/login">العودة إلى تسجيل الدخول</Link>
      </div>
    </main>
  );
}
