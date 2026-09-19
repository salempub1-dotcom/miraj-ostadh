import { NextResponse } from 'next/server';

const EXPECTED_REF = 'ltcchvjxgdcdsvgrmtjb';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    '';

  let supabaseRefMatches = false;
  try {
    supabaseRefMatches = new URL(supabaseUrl).hostname.startsWith(`${EXPECTED_REF}.`);
  } catch {
    supabaseRefMatches = false;
  }

  const healthy = Boolean(supabaseUrl && publishableKey && supabaseRefMatches);

  return NextResponse.json(
    {
      app: 'Miraj Ostadh',
      healthy,
      expectedSupabaseRef: EXPECTED_REF,
      supabaseUrlConfigured: Boolean(supabaseUrl),
      publishableKeyConfigured: Boolean(publishableKey),
      supabaseRefMatches,
      siteUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      vercelUrlConfigured: Boolean(process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL),
    },
    { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
