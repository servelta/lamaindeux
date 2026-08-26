/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Allow images stored in Supabase Storage (public bucket for avatars/logos only).
        hostname: "*.supabase.co",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb", // allow photo uploads in booking/quote requests
    },
  },
  async headers() {
    return [
      {
        // Applies to every route. Server Actions already get Next's
        // built-in origin-checking (CSRF protection) for free — these
        // headers cover the browser-side hardening that's separate from that.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
