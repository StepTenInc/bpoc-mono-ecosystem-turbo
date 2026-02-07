import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin client bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { action, postId, link, linkIndex } = await req.json();

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    // Get current applied_links
    const { data: post, error: fetchError } = await supabaseAdmin
      .from('insights_posts')
      .select('applied_links')
      .eq('id', postId)
      .single();

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    let updatedLinks = post?.applied_links || [];

    if (action === 'add' && link) {
      // Add new link
      updatedLinks = [...updatedLinks, link];
      
      // Also add to article_links table
      if (link.target_id) {
        await supabaseAdmin
          .from('article_links')
          .insert({
            from_article_id: postId,
            to_article_id: link.target_id,
            anchor_text: link.anchor_text,
            link_type: 'sibling',  // Default to sibling
            context: null,
          });
      }
      
    } else if (action === 'remove' && typeof linkIndex === 'number') {
      // Get the link before removing (for internal_links cleanup)
      const linkToRemove = updatedLinks[linkIndex];
      updatedLinks = updatedLinks.filter((_: any, i: number) => i !== linkIndex);
      
      // Also remove from article_links table
      if (linkToRemove?.target_id) {
        await supabaseAdmin
          .from('article_links')
          .delete()
          .eq('from_article_id', postId)
          .eq('to_article_id', linkToRemove.target_id);
      }
    }

    // Update the post
    const { error: updateError } = await supabaseAdmin
      .from('insights_posts')
      .update({ 
        applied_links: updatedLinks,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      applied_links: updatedLinks,
      message: action === 'add' ? 'Link added' : 'Link removed'
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET to fetch target post info
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug required' }, { status: 400 });
  }

  const { data: post, error } = await supabaseAdmin
    .from('insights_posts')
    .select('id, title')
    .eq('slug', slug)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(post);
}

