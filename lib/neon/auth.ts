import 'server-only';
import { createNeonAuth } from '@neondatabase/auth/next/server';

/** Only trial previews use this instance. Never fall back to Supabase credentials. */
export const neonAuth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
});
