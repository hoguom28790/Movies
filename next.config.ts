import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.ophim.live" },
      { protocol: "https", hostname: "phimimg.com" },
      { protocol: "https", hostname: "phim.nguonc.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "*.ophim.live" },
      { protocol: "https", hostname: "*.phimimg.com" },
      { protocol: "https", hostname: "*.tmdb.org" },
    ],
  },
  cleanDistDir: true,
  output: "standalone",
};

export default nextConfig;
