import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 requires Turbopack config
  turbopack: {},
  // Disable TypeScript checking during builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Output standalone for optimal Vercel deployment
  output: 'standalone',
  experimental: {
    esmExternals: true,
  },
  // Configure images to allow Supabase storage domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
  },
  // Exclude puppeteer packages from serverless bundle to avoid size limits
  // Also exclude ffmpeg-static to preserve the binary path
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium', 'ffmpeg-static'],
  // Vercel handles output automatically - no need to specify 'standalone'
  async redirects() {
    return [
      {
        source: '/resume-builder',
        destination: '/candidate/resume',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
// Force fresh build Mon Dec 15 2025 - Rebuild Cache request
