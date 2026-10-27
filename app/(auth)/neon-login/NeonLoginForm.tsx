'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createAuthClient } from '@neondatabase/auth/next';

const authClient = createAuthClient();
export default function NeonLoginForm() {
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [error,setError]=useState('');
 const [pending,setPending]=useState(false);
 const router=useRouter();
 async function submit(e:FormEvent<HTMLFormElement>){
   e.preventDefault();setPending(true);setError('');
   try {
     const result=await authClient.signIn.email({email,password});
     if(result.error) {setError('تعذر تسجيل الدخول. تحقق من الحساب وكلمة المرور.');return;}
     router.replace('/neon-test');router.refresh();
   } catch {setError('تعذر الاتصال بخدمة Neon Auth.');}
   finally{setPending(false);}
 }
 return <form className="form-stack" onSubmit={submit}>
  <label><span>البريد الإلكتروني</span><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
  <label><span>كلمة المرور</span><input type="password" autoComplete="current-password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required/></label>
  {error&&<p className="form-alert error" role="alert">{error}</p>}
  <button type="submit" className="primary-btn wide" disabled={pending}>{pending?'جارٍ التحقق...':'الدخول عبر Neon Auth'}</button>
  <p className="auth-switch">لم تستعد حسابك في Neon؟ لا تستخدم كلمة مرور Supabase القديمة؛ أتمم استعادة كلمة المرور من Neon أولًا.</p>
 </form>;
}
