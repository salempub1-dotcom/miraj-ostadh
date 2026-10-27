import NeonLoginForm from './NeonLoginForm';

export default function NeonLoginPage() {
 return <div className="auth-card"><div className="auth-card-head">
   <span className="eyebrow">تجربة Neon Auth</span><h2>الدخول التجريبي</h2>
   <p>هذه صفحة اختبار مستقلة. لا تغيّر جلسة Supabase المستخدمة في الموقع الرسمي.</p>
 </div><NeonLoginForm/></div>;
}
