import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SiloPageClient from './SiloPageClient';

// Always show fresh content
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getSiloData(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

  try {
    const res = await fetch(`${baseUrl}/api/silos/${slug}?limit=50`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching silo:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSiloData(slug);

  if (!data?.silo) {
    return {
      title: 'Silo Not Found | BPOC.IO',
    };
  }

  const silo = data.silo;
  const title = silo.seo_title || `${silo.name} | BPOC.IO Insights`;
  const description = silo.seo_description || silo.description || `Explore articles about ${silo.name} in the Philippine BPO industry.`;

  return {
    title,
    description,
    keywords: silo.seo_keywords || `${silo.name}, BPO, Philippines, outsourcing`,
    openGraph: {
      title,
      description,
      url: `https://bpoc-stepten.vercel.app/insights/silo/${slug}`,
      type: 'website',
      images: silo.hero_image ? [
        {
          url: silo.hero_image,
          width: 1200,
          height: 630,
          alt: silo.name,
        },
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://bpoc-stepten.vercel.app/insights/silo/${slug}`,
    },
  };
}

export default async function SiloPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getSiloData(slug);

  if (!data?.silo) {
    notFound();
  }

  // JSON-LD Schema for the silo page
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: data.silo.name,
    description: data.silo.description || `Articles about ${data.silo.name}`,
    url: `https://bpoc-stepten.vercel.app/insights/silo/${slug}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: data.articles.map((article: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: article.title,
        url: `https://bpoc-stepten.vercel.app/insights/${article.slug}`,
      })),
    },
    publisher: {
      '@type': 'Organization',
      name: 'BPOC.IO',
      url: 'https://bpoc-stepten.vercel.app',
    },
  };

  // Add pillar article info to schema if available
  if (data.pillarPost) {
    jsonLd.mainContentOfPage = {
      '@type': 'Article',
      headline: data.pillarPost.title,
      description: data.pillarPost.description,
      datePublished: data.pillarPost.published_at,
      author: {
        '@type': 'Person',
        name: data.pillarPost.author || 'BPOC.IO',
      },
      image: data.pillarPost.hero_url,
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiloPageClient
        silo={data.silo}
        pillarPost={data.pillarPost}
        articles={data.articles}
        pagination={data.pagination}
        relatedSilos={data.relatedSilos}
      />
    </>
  );
}
