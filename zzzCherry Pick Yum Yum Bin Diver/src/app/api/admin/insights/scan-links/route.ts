import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/insights/scan-links
 * Runs the smart link scanner to find missing links
 */
export async function POST(req: NextRequest) {
  try {
    const { action, articleId } = await req.json();

    if (action === 'scan-single' && articleId) {
      // Scan a single article
      const { data, error } = await supabaseAdmin.rpc(
        'generate_link_suggestions_for_article',
        { article_id: articleId }
      );

      if (error) {
        console.error('Single scan error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        suggestionsCreated: data,
        message: `Created ${data} link suggestions for this article`
      });
    }

    if (action === 'scan-all') {
      // Scan ALL articles (bulk)
      const { data, error } = await supabaseAdmin.rpc(
        'generate_link_suggestions_bulk'
      );

      if (error) {
        console.error('Bulk scan error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const totalSuggestions = data?.reduce(
        (sum: number, row: any) => sum + (row.suggestions_created || 0),
        0
      );

      return NextResponse.json({
        success: true,
        articlesScanned: data?.length || 0,
        totalSuggestions,
        details: data,
        message: `Scanned ${data?.length || 0} articles, created ${totalSuggestions} suggestions`
      });
    }

    if (action === 'find-missing' && articleId) {
      // Just find missing links (don't create suggestions)
      const { data, error } = await supabaseAdmin.rpc(
        'find_missing_links_for_article',
        { article_id: articleId }
      );

      if (error) {
        console.error('Find missing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        missingLinks: data,
        count: data?.length || 0
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: scan-single, scan-all, or find-missing' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Smart scanner error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run scanner' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/insights/scan-links
 * Get scan overview (which articles need attention)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'overview';

    if (type === 'overview') {
      // Get quick overview of articles needing links
      const { data, error } = await supabaseAdmin.rpc(
        'scan_all_articles_for_missing_links'
      );

      if (error) {
        console.error('Overview error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        articlesNeedingAttention: data?.length || 0,
        articles: data
      });
    }

    if (type === 'needing-links') {
      // Get articles that need link attention
      const { data, error } = await supabaseAdmin.rpc('detect_orphan_articles');

      if (error) {
        console.error('Needing links error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        count: data?.length || 0,
        articles: data
      });
    }

    return NextResponse.json(
      { error: 'Invalid type. Use: overview or needing-links' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Get scanner data error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get scanner data' },
      { status: 500 }
    );
  }
}

