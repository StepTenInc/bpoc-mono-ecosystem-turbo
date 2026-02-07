import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AuthorProfileClient from './AuthorProfileClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  if (slug === 'ate-yna') {
    return {
      title: 'Ate Yna | BPOC.IO Career Coach',
      description: 'Meet Ate Yna, your supportive BPO career guide. Honest advice, resume tips, and industry secrets from someone who’s been there.',
    };
  }

  return {
    title: 'Author Profile | BPOC.IO',
  };
}

export default async function AuthorProfilePage({ params }: Props) {
  const { slug } = await params;

  // Ideally fetch author data here. For now, we handle Ate Yna specifically.
  if (slug !== 'ate-yna') {
     // We can support others later, but for now just let it render the client component which handles fallback
  }

  return <AuthorProfileClient slug={slug} />;
}












