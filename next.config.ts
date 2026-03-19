import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.ophim.live" },
      { protocol: "https", hostname: "phimimg.com" },
      { protocol: "https", hostname: "phim.nguonc.com" },
      { protocol: "https", hostname: "*.ophim.live" },
      { protocol: "https", hostname: "*.phimimg.com" },
    ],
  },
  cleanDistDir: true,
  output: "standalone",
};

export default nextConfig;
