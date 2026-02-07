import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { VideoCallProvider } from "@/contexts/VideoCallContext";
import BackToTopButton from "@/components/shared/ui/back-to-top";
import Footer from "@/components/shared/layout/Footer";
import ClientConditionalFooter from "@/components/shared/layout/ClientConditionalFooter";
import { ToastProvider } from "@/components/shared/ui/toast";
import ChatWidgetWrapper from "@/components/chat/ChatWidgetWrapper";
import { IncomingCallNotification, VideoCallOverlay } from "@/components/video";
import { Analytics } from "@vercel/analytics/react";
import { createClient } from '@supabase/supabase-js';

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
    images: [
      {
        url: "/images/536272983_122107788842977640_5462108951149244384_n.jpg",
        width: 1200,
        height: 630,
        alt: "BPOC.IO - Where BPO Careers Begin",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BPOC.IO - Where BPO Careers Begin",
    description: "Revolutionizing BPO recruitment with AI-powered tools",
    images: ["/images/536272983_122107788842977640_5462108951149244384_n.jpg"],
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
  manifest: "/site.webmanifest",
};

/**
 * Fetch global Organization schema from Supabase
 */
async function getOrganizationSchema() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'organization_schema')
      .single();

    if (data?.setting_value) {
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        ...data.setting_value,
      };
    }
  } catch (error) {
    console.error('Failed to fetch organization schema:', error);
  }

  // Fallback schema if database fetch fails
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BPOC Careers',
    url: 'https://www.bpoc.io',
    logo: 'https://www.bpoc.io/icon.svg',
    description: 'AI-powered BPO recruitment platform connecting Filipino professionals with global opportunities',
  };
}

/**
 * Fetch global Website schema from Supabase
 */
async function getWebsiteSchema() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'website_schema')
      .single();

    if (data?.setting_value) {
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        ...data.setting_value,
      };
    }
  } catch (error) {
    console.error('Failed to fetch website schema:', error);
  }

  // Fallback schema
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://www.bpoc.io',
    name: 'BPOC Careers',
    description: 'BPO careers and outsourcing insights',
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch global schemas (cached by Next.js)
  const organizationSchema = await getOrganizationSchema();
  const websiteSchema = await getWebsiteSchema();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Global Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />

        {/* Global Website Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>

      <body
        className={`${interSans.variable} ${jetbrainsMono.variable} antialiased min-h-screen bg-black text-white`}
        suppressHydrationWarning
      >

        <AuthProvider>
          <AdminProvider>
            <VideoCallProvider>
              <ToastProvider>
                {children}
                <Analytics />
                <ClientConditionalFooter />
                <BackToTopButton />
                <ChatWidgetWrapper />
                <IncomingCallNotification />
                <VideoCallOverlay />
              </ToastProvider>
            </VideoCallProvider>
          </AdminProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
