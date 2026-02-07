/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@repo/ui", "@repo/shared"],
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "ayrdnsiaylomcemfdisr.supabase.co",
            },
        ],
    },
    typescript: {
        // WARNING: Build will proceed even with type errors
        // TODO: Fix all TypeScript errors and remove this
        ignoreBuildErrors: true,
    },
    eslint: {
        // WARNING: Build will proceed even with lint errors
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
