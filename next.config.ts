import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    formats: ['image/avif', 'image/webp'],
    unoptimized: false, // Turned back on to allow next/image to optimize OMDb & Fanart high-res pictures
  },
  async redirects() {
    return [
      {
        source: '/topxx',
        destination: '/v2k9r5w8m3x7n1p4q0z6',
        permanent: true,
      },
    ]
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
