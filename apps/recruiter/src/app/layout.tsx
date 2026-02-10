import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { VideoCallProvider } from "@/contexts/VideoCallContext";
import RecruiterLayoutClient from "@/components/recruiter/RecruiterLayoutClient";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "BPOC.IO - Recruiter Portal",
  description: "Recruit top BPO talent with AI-powered matching",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[#0B0B0D] text-gray-300 antialiased`}>
        <AuthProvider>
          <VideoCallProvider>
            <RecruiterLayoutClient>
              {children}
            </RecruiterLayoutClient>
          </VideoCallProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
