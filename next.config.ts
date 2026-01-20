import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'loop.frontiersin.org',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'www.t.u-tokyo.ac.jp',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'researchmap.jp',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.kikaib.t.u-tokyo.ac.jp',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.ne.t.u-tokyo.ac.jp',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
