/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid OOM on small Vercel builders during lint/typecheck of large assets
  experimental: {
    webpackMemoryOptimizations: true,
  },
};

export default nextConfig;
