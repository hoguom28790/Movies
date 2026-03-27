import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  cleanDistDir: true,
  output: "standalone",
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
