import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { saveProfileAction } from './actions';

export default async function OnboardingProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { supabase, userId } = await requireUser();
  const { error } = await searchParams;

  const [{ data: profile }, { data: context }] = await Promise.all([
    supabase.from('profiles').select('full_name, display_name, province, school_name').eq('id', userId).single(),
    supabase
      .from('teacher_academic_contexts')
      .select('id, onboarding_completed_at')
      .eq('user_id', userId)
      .eq('is_current', true)
      .maybeSingle(),
  ]);

  if (context?.onboarding_completed_at) redirect('/today');

  return (
    <div className="onboarding-card">
      <div className="step-line"><span className="active" /><span /><span /><span /></div>
      <span className="eyebrow">الخطوة 1 من 4</span>
      <h1>أخبرنا عنك</h1>
      <p className="muted-copy">هذه المعلومات ستظهر في مكتبك، ويمكن تغييرها لاحقًا من حسابك.</p>

      {error ? <div className="form-alert error">{error}</div> : null}

      <form action={saveProfileAction} className="form-stack onboarding-form">
        <label>
          <span>الاسم الذي تريد ظهوره</span>
          <input
            name="display_name"
            type="text"
            required
            minLength={2}
            defaultValue={profile?.display_name ?? profile?.full_name ?? ''}
            placeholder="مثال: الأستاذة سارة"
          />
        </label>
        <label>
          <span>الولاية <em>اختياري</em></span>
          <input name="province" type="text" defaultValue={profile?.province ?? ''} placeholder="مثال: الجزائر" />
        </label>
        <label>
          <span>اسم المؤسسة <em>اختياري</em></span>
          <input name="school_name" type="text" defaultValue={profile?.school_name ?? ''} placeholder="المدرسة الابتدائية..." />
        </label>
        <button className="primary-btn wide" type="submit">متابعة</button>
      </form>
    </div>
  );
}
