import Link from 'next/link';
import { MailCheck } from 'lucide-react';

export default function CheckEmailPage() {
  return (
    <div className="auth-card centered-card">
      <div className="success-icon"><MailCheck size={34} /></div>
      <span className="eyebrow">خطوة أخيرة</span>
      <h2>تحقق من بريدك الإلكتروني</h2>
      <p>أرسلنا لك رسالة لتأكيد الحساب. بعد التأكيد ستعود إلى معراج الأستاذ لإكمال إعداد مكتبك.</p>
      <Link className="secondary-btn wide-link" href="/login">العودة إلى تسجيل الدخول</Link>
    </div>
  );
}
