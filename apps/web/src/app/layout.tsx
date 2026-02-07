import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { ToastProvider } from "@/components/shared/ui/toast";

const interSans = Inter({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL('https://www.bpoc.io'),
    title: "BPOC.IO - Where BPO Careers Begin",
    description: "The ultimate AI-powered BPO recruitment platform for Filipino professionals. Build your career with FREE resume builder, comprehensive skill assessments, and ATS optimization.",
    keywords: "BPO, career, resume builder, AI, Philippines, job matching, skills assessment, customer service, technical support, sales",
    authors: [{ name: "BPOC.IO Team" }],
    creator: "BPOC.IO",
    publisher: "BPOC.IO",
    openGraph: {
        title: "BPOC.IO - Where BPO Careers Begin",
        description: "Revolutionizing BPO recruitment with AI-powered tools for Filipino professionals",
        url: "https://www.bpoc.io",
        siteName: "BPOC.IO",
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "BPOC.IO - Where BPO Careers Begin",
        description: "Revolutionizing BPO recruitment with AI-powered tools",
        creator: "@bpocai",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    icons: {
        icon: '/icon.svg',
        apple: '/icon.svg',
        shortcut: '/icon.svg',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'Organization',
                            name: 'BPOC Careers',
                            url: 'https://www.bpoc.io',
                            logo: 'https://www.bpoc.io/icon.svg',
                            description: 'AI-powered BPO recruitment platform connecting Filipino professionals with global opportunities',
                        }),
                    }}
                />
            </head>
            <body
                className={`${interSans.variable} ${jetbrainsMono.variable} antialiased min-h-screen bg-black text-white`}
                suppressHydrationWarning
            >
                <AuthProvider>
                    <AdminProvider>
                        <ToastProvider>
                            {children}
                        </ToastProvider>
                    </AdminProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
