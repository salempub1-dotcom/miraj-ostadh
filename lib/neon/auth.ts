import 'server-only';
import { createNeonAuth } from '@neondatabase/auth/next/server';

/** Construct only during a request. No unsafe fallback or hardcoded secrets. */
export function getNeonAuth() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret) {
    throw new Error('Neon Auth trial is not configured. Set its isolated preview environment variables.');
  }
  return createNeonAuth({baseUrl,cookies:{secret}});
}
