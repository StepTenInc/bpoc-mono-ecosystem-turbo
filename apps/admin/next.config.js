/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/ui', '@repo/shared'],
  experimental: {
    // Enable srcDir
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Redirect old app/ paths if needed
  async rewrites() {
    return [];
  },
};

export default nextConfig;
