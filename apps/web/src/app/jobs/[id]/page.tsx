import { Metadata } from 'next';
import JobDetailClient from './JobDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bpoc.io'}/api/jobs/public/${id}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return {
        title: 'Job Not Found | BPOC.IO'
      };
    }

    const data = await response.json();
    const job = data.job;

    const salaryText = job.salary_min && job.salary_max
      ? `${job.currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}/month`
      : job.salary_min
      ? `${job.currency} ${job.salary_min.toLocaleString()}+/month`
      : 'Competitive salary';

    const title = `${job.title} - ${job.agency} | BPO Jobs Philippines`;
    const description = `${job.title} at ${job.agency}. ${salaryText}. ${job.work_arrangement} · ${job.work_type.replace('_', ' ')} · ${job.shift} shift. Apply now on BPOC.IO - Philippines #1 BPO job platform.`;

    return {
      title,
      description,
      keywords: `${job.title}, BPO jobs Philippines, ${job.agency}, ${job.work_arrangement} jobs, ${job.shift} shift, ${job.skills?.join(', ') || ''}`,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `https://www.bpoc.io/jobs/${id}`,
        siteName: 'BPOC.IO',
        images: [
          {
            url: 'https://www.bpoc.io/images/536272983_122107788842977640_5462108951149244384_n.jpg',
            width: 1200,
            height: 630,
            alt: `${job.title} - BPOC.IO BPO Jobs`
          }
        ]
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'BPO Jobs Philippines | BPOC.IO'
    };
  }
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <JobDetailClient jobId={id} />;
}
