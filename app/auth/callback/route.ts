import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/onboarding/profile';
  }
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));
  const redirectTo = request.nextUrl.clone();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      redirectTo.pathname = next;
      redirectTo.search = '';
      return NextResponse.redirect(redirectTo);
    }
  }

  redirectTo.pathname = '/auth/error';
  redirectTo.search = '';
  return NextResponse.redirect(redirectTo);
}
