/**
 * LINK HEALTH CHECK
 * Uses new detect_orphan_articles() function from migration
 * 
 * Returns health metrics:
 * - Total published articles
 * - Articles with incoming links
 * - Orphan articles (no incoming links)
 * - Overall link health percentage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Checking link health...');

    // Use new detect_orphan_articles() function
    const { data: orphans, error: orphanError } = await supabase
      .rpc('detect_orphan_articles');

    if (orphanError) {
      console.error('Orphan detection error:', orphanError);
      throw orphanError;
    }

    // Get total published articles count
    const { count: totalArticles } = await supabase
      .from('insights_posts')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true);

    // Calculate health metrics
    const orphanCount = orphans?.length || 0;
    const linkedCount = (totalArticles || 0) - orphanCount;
    const healthPercentage = totalArticles 
      ? Math.round((linkedCount / totalArticles) * 100)
      : 0;

    console.log(`✅ Link health: ${healthPercentage}% (${linkedCount}/${totalArticles} articles linked)`);

    return NextResponse.json({
      success: true,
      health: {
        totalArticles: totalArticles || 0,
        linkedArticles: linkedCount,
        orphanArticles: orphanCount,
        healthPercentage,
        status: healthPercentage >= 90 ? 'excellent' 
              : healthPercentage >= 75 ? 'good'
              : healthPercentage >= 50 ? 'fair'
              : 'poor',
      },
      orphans: orphans || [],
      recommendations: orphanCount > 0 
        ? [`Add internal links to ${orphanCount} orphan articles`]
        : ['Link health is optimal'],
    });

  } catch (error: any) {
    console.error('❌ Link health check error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
