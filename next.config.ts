import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      // Routes from the first version of the app keep working.
      { source: "/upcoming", destination: "/meetings", permanent: true },
      { source: "/previous", destination: "/meetings?tab=past", permanent: true },
      { source: "/personal-room", destination: "/room", permanent: true },
      // Short invite links: /m/abc-defg-hij
      { source: "/m/:id", destination: "/meeting/:id", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), display-capture=(self)" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
