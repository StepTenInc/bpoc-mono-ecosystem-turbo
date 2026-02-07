import { Metadata } from 'next';
import PillarArticlePage, { getSiloMetadata } from '../../components/PillarArticlePage';

const SILO_SLUG = 'bpo-company-reviews';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSiloMetadata(SILO_SLUG, slug);

  if (!data) {
    return { title: 'Article Not Found | BPOC.IO' };
  }

  const { post, canonicalUrl } = data;

  return {
    title: post.seo?.meta_title || `${post.title} | Company Reviews | BPOC.IO`,
    description: post.seo?.meta_description || post.description,
    openGraph: {
      title: post.title,
      description: post.seo?.meta_description || post.description,
      url: canonicalUrl,
      type: 'article',
    },
    alternates: { canonical: canonicalUrl },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <PillarArticlePage siloSlug={SILO_SLUG} articleSlug={slug} />;
}
