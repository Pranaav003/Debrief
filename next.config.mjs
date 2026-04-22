/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prevents broken vendor chunks when using @supabase/supabase-js in Server Components
    serverComponentsExternalPackages: ["@supabase/supabase-js"],
  },
};

export default nextConfig;
