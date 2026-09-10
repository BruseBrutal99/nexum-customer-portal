/** @type {import('next').NextConfig} */
const tmsFrameAncestors = [
  "'self'",
  "https://nexum-tms.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
]
  .concat(
    (process.env.PORTAL_FRAME_ANCESTORS ?? "")
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean),
  )
  .join(" ");

const nextConfig = {
  // Avoid OOM on small Vercel builders during lint/typecheck of large assets
  experimental: {
    webpackMemoryOptimizations: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${tmsFrameAncestors}`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
