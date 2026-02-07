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
};

export default nextConfig;
