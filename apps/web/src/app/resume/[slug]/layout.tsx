import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Get the base URL for the site
  // In development, use localhost; in production, use the configured URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'https://www.bpoc.io');

  try {
    // Fetch resume data from Supabase
    const { data: resume, error: resumeError } = await supabaseAdmin
      .from('candidate_resumes')
      .select(`
        id,
        title,
        slug,
        template_used,
        generated_data,
        candidate_id
      `)
      .eq('slug', slug)
      .single();

    if (resumeError || !resume) {
      return {
        title: 'Resume Not Found | BPOC.IO',
        description: 'Resume not found on BPOC.IO',
      };
    }

    // Get candidate info
    const { data: candidate } = await supabaseAdmin
      .from('candidates')
      .select(`
        id,
        full_name,
        avatar_url
      `)
      .eq('id', resume.candidate_id)
      .single();

    // Get candidate profile for position and location
    const { data: profile } = await supabaseAdmin
      .from('candidate_profiles')
      .select(`
        position,
        location,
        location_city,
        location_country
      `)
      .eq('candidate_id', resume.candidate_id)
      .single();

    // Extract data from resume content or fallback to database values
    const resumeContent = resume.generated_data || {};
    const fullName = resumeContent.name || candidate?.full_name || 'Professional';
    const title = resume.title || 'Resume';
    const position = resumeContent.bestJobTitle || profile?.position || 'BPO Professional';
    const description = `${fullName}'s resume created FREE with BPOC.IO's AI resume builder. Build yours FREE at bpoc.io!`;

    // Construct OG image URL with version parameter to bust cache
    const ogImageUrl = `${baseUrl}/api/og/resume?slug=${slug}&v=3`;

    return {
      title: `${title} - ${fullName} | BPOC.IO`,
      description,
      openGraph: {
        title: `${fullName} - ${title}`,
        description,
        url: `${baseUrl}/resume/${slug}`,
        siteName: 'BPOC.IO',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${fullName}'s resume on BPOC.IO`,
            type: 'image/png',
          },
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${fullName} - ${title}`,
        description,
        images: [ogImageUrl],
      },
      other: {
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:image:type': 'image/png',
      },
    };
  } catch (error) {
    console.error('Error fetching resume metadata:', error);
  }

  // Fallback metadata if fetch fails
  const ogImageUrl = `${baseUrl}/api/og/resume?slug=${slug}&v=3`;
  return {
    title: `Resume | BPOC.IO`,
    description: 'Professional resume created FREE with BPOC.IO AI resume builder. Build yours FREE today!',
    openGraph: {
      title: `Resume | BPOC.IO`,
      description: 'Professional resume created FREE with BPOC.IO AI resume builder. Build yours FREE today!',
      url: `${baseUrl}/resume/${slug}`,
      siteName: 'BPOC.IO',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Resume on BPOC.IO`,
          type: 'image/png',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Resume | BPOC.IO`,
      description: 'Professional resume created FREE with BPOC.IO AI resume builder. Build yours FREE today!',
      images: [ogImageUrl],
    },
    other: {
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:type': 'image/png',
    },
  };
}

export default function ResumeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

