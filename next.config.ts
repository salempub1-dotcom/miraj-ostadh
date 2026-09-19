import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // These are public client configuration values, not secrets. Keeping them
  // here prevents broken deployments if the Vercel integration variables are
  // missing or stale while still targeting the verified Miraj Ostadh project.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://ltcchvjxgdcdsvgrmtjb.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_FwhdxJ9Bci35KHTNiqcqlA_Wx-saQqz',
    NEXT_PUBLIC_SITE_URL: 'https://miraj-ostadh-elmiraj1.vercel.app',
  },
};

export default nextConfig;
