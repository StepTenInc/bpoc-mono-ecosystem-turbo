'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import InsightsEditor from '@/components/admin/insights/InsightsEditor';
import { Loader2 } from 'lucide-react';

export default function EditInsightPageClient({ id }: { id: string }) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('insights_posts')
        .select('*, seo:seo_metadata(*)')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
      } else {
        setPost(data);
      }
      setLoading(false);
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!post) {
    return <div className="text-white">Post not found</div>;
  }

  return <InsightsEditor post={post} />;
}












