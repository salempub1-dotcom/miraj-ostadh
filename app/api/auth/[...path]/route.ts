import { neonAuth } from '@/lib/neon/auth';

export const runtime = 'nodejs';
export const { GET, POST, PUT, DELETE, PATCH } = neonAuth.handler();
