import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    formats: ['image/avif', 'image/webp'],
    unoptimized: false, // Turned back on to allow next/image to optimize OMDb & Fanart high-res pictures
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
