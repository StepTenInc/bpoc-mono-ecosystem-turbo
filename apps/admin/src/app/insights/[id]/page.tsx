import { supabase } from '@/lib/supabase';
import InsightsEditor from '@/components/admin/insights/InsightsEditor';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditInsightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // We can't use the client-side supabase instance in a server component for fetching if we want SSR, 
  // but for admin dashboard client-side fetching is often fine or we use a server client.
  // Since I don't have a server-side supabase client setup readily available in lib (only client),
  // I will make this a client component or just fetch on client.
  // Actually, to make it easier, I'll just make the Page a wrapper that fetches data client side 
  // OR I can keep it Server Component if I had the cookie-based client.
  // Given the current setup in src/lib/supabase.ts is client-only (createClient directly),
  // I should probably make this page a Client Component to avoid "window is not defined" if I used that lib.
  // However, I can just use the Editor component to fetch data if I pass the ID.
  // But standard Next.js pattern: Fetch on server.
  // I'll try to fetch using standard fetch or make the page client side.
  // Making the page client side is safer with the current lib structure.
  
  return <EditInsightPageClient id={id} />;
}

// Client wrapper
import EditInsightPageClient from './EditInsightPageClient';












