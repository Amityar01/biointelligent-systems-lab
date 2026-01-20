import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
        ],
      },
    ];
  },
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
