import type { NextConfig } from "next";

// NOT a NEXT_PUBLIC_ var: those get inlined at build time, but this proxy
// target is read at runtime (local dev falls back to localhost:8080, Docker
// overrides it to the backend service).
const backend =
  process.env.API_PROXY_TARGET ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Standalone output is for the Docker image; on Vercel it breaks the build
  // finalizer (missing .nft.json trace files), so let Vercel build normally.
  output: process.env.VERCEL ? undefined : "standalone",
  images: {
    remotePatterns: [
      // Production uploads are stored in Supabase Storage and served from
      // external URLs (https://<project>.supabase.co/...). Whitelist the host
      // so next/image can load listing photos instead of showing placeholders.
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  async rewrites() {
    return [
      // Vercel Cron pings /api/cron/ping to keep the backend awake. This must
      // NOT be forwarded to the backend — serve the local route handler instead,
      // so it has to come before the catch-all backend rewrite below.
      {
        source: "/api/cron/:path*",
        destination: "/api/cron/:path*",
      },
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backend}/uploads/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
