/**
 * CMS - Dashboard Statistics
 * 
 * Returns comprehensive stats for the content pipeline:
 * - Article counts by status
 * - Quality metrics
 * - SEO scores
 * - Performance trends
 * - Top categories
 * - Recent activity
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    console.log('📊 Fetching dashboard statistics...');

    // ============================================
    // ARTICLE COUNTS BY STATUS
    // ============================================
    const { data: statusCounts } = await supabase
      .from('insights_posts')
      .select('pipeline_stage, is_published')
      .then(result => {
        const counts = {
          total: result.data?.length || 0,
          published: result.data?.filter(p => p.is_published).length || 0,
          draft: result.data?.filter(p => p.pipeline_stage === 'draft').length || 0,
          review: result.data?.filter(p => p.pipeline_stage === 'review').length || 0,
          archived: result.data?.filter(p => p.pipeline_stage === 'archived').length || 0,
        };
        return { data: counts };
      });

    // ============================================
    // PIPELINE STATS
    // ============================================
    const { data: pipelines } = await supabase
      .from('content_pipelines')
      .select('status, current_stage, quality_score')
      .then(result => {
        const stats = {
          total: result.data?.length || 0,
          inProgress: result.data?.filter(p => p.status === 'in_progress').length || 0,
          completed: result.data?.filter(p => p.status === 'completed').length || 0,
          failed: result.data?.filter(p => p.status === 'failed').length || 0,
          avgQualityScore: result.data
            ? ((result.data.filter(p => p.quality_score)
              .reduce((sum, p) => sum + (p.quality_score || 0), 0) / (result.data.length || 1)) || 0)
            : 0,
        };
        return { data: stats };
      });

    // ============================================
    // QUALITY METRICS
    // ============================================
    const { data: qualityMetrics } = await supabase
      .from('insights_posts')
      .select('generation_metadata')
      .eq('is_published', true)
      .then(result => {
        const articles = result.data || [];
        const qualityScores = articles
          .map(a => a.generation_metadata?.qualityScore)
          .filter(Boolean);
        const rankMathScores = articles
          .map(a => a.generation_metadata?.rankMathScore)
          .filter(Boolean);

        return {
          data: {
            avgQualityScore: qualityScores.length
              ? (qualityScores.reduce((sum: number, s: number) => sum + s, 0) / qualityScores.length) || 0
              : 0,
            avgRankMathScore: rankMathScores.length
              ? (rankMathScores.reduce((sum: number, s: number) => sum + s, 0) / rankMathScores.length) || 0
              : 0,
            articlesAbove80: rankMathScores.filter((s: number) => s >= 80).length,
            articlesBelow80: rankMathScores.filter((s: number) => s < 80).length,
          },
        };
      });

    // ============================================
    // TOP CATEGORIES
    // ============================================
    const { data: categories } = await supabase
      .from('insights_posts')
      .select('category, silo_topic')
      .eq('is_published', true)
      .then(result => {
        const categoryCounts: Record<string, number> = {};
        result.data?.forEach(article => {
          const cat = article.silo_topic || article.category || 'Uncategorized';
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        const sorted = Object.entries(categoryCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([name, count]) => ({ name, count }));

        return { data: sorted };
      });

    // ============================================
    // RECENT ACTIVITY (Last 7 days)
    // ============================================
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentArticles } = await supabase
      .from('insights_posts')
      .select('id, title, slug, published_at, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: recentPipelines } = await supabase
      .from('content_pipelines')
      .select('id, brief, status, current_stage, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    // ============================================
    // SEO HEALTH
    // ============================================
    const { data: seoHealth } = await supabase
      .from('insights_posts')
      .select('generation_metadata')
      .eq('is_published', true)
      .then(result => {
        const articles = result.data || [];
        const totalArticles = articles.length;

        const withInternalLinks = articles.filter(
          a => (a.generation_metadata?.internalLinksCount || 0) >= 3
        ).length;

        const withOutboundLinks = articles.filter(
          a => (a.generation_metadata?.outboundLinksCount || 0) >= 2
        ).length;

        const withMetaDescription = articles.filter(
          a => a.generation_metadata?.metaDescription
        ).length;

        return {
          data: {
            articlesWithInternalLinks: withInternalLinks,
            articlesWithOutboundLinks: withOutboundLinks,
            articlesWithMetaDescription: withMetaDescription,
            internalLinksPercentage: totalArticles ? (withInternalLinks / totalArticles) * 100 : 0,
            outboundLinksPercentage: totalArticles ? (withOutboundLinks / totalArticles) * 100 : 0,
            metaDescriptionPercentage: totalArticles ? (withMetaDescription / totalArticles) * 100 : 0,
          },
        };
      });

    // ============================================
    // ORPHAN ARTICLES
    // ============================================
    const { data: orphans } = await supabase.rpc('detect_orphan_articles').then(result => ({
      data: {
        count: result.data?.length || 0,
        articles: result.data?.slice(0, 5) || [],
      },
    }));

    // ============================================
    // KEYWORD CANNIBALIZATION
    // ============================================
    const { data: cannibalization } = await supabase
      .from('targeted_keywords')
      .select('keyword, article_id, is_primary')
      .eq('is_primary', true)
      .then(result => {
        const keywordCounts: Record<string, number> = {};
        result.data?.forEach(kw => {
          keywordCounts[kw.keyword] = (keywordCounts[kw.keyword] || 0) + 1;
        });

        const conflicts = Object.entries(keywordCounts)
          .filter(([, count]) => count > 1)
          .map(([keyword, count]) => ({ keyword, count }));

        return {
          data: {
            totalConflicts: conflicts.length,
            conflicts: conflicts.slice(0, 10),
          },
        };
      });

    // ============================================
    // PERFORMANCE TRENDS (Last 30 days)
    // ============================================
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: trends } = await supabase
      .from('insights_posts')
      .select('published_at, generation_metadata')
      .eq('is_published', true)
      .gte('published_at', thirtyDaysAgo.toISOString())
      .order('published_at', { ascending: true })
      .then(result => {
        const dailyCounts: Record<string, number> = {};
        const dailyQuality: Record<string, number[]> = {};

        result.data?.forEach(article => {
          const date = article.published_at?.split('T')[0];
          if (date) {
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;

            const qualityScore = article.generation_metadata?.qualityScore;
            if (qualityScore) {
              dailyQuality[date] = dailyQuality[date] || [];
              dailyQuality[date].push(qualityScore);
            }
          }
        });

        const trendData = Object.keys(dailyCounts).map(date => ({
          date,
          count: dailyCounts[date],
          avgQuality: dailyQuality[date]
            ? dailyQuality[date].reduce((sum, s) => sum + s, 0) / dailyQuality[date].length
            : null,
        }));

        return { data: trendData };
      });

    console.log('✅ Statistics fetched successfully');

    return NextResponse.json({
      success: true,
      stats: {
        articles: statusCounts,
        pipelines,
        quality: qualityMetrics,
        categories,
        recentActivity: {
          articles: recentArticles,
          pipelines: recentPipelines,
        },
        seo: seoHealth,
        orphans,
        cannibalization,
        trends,
      },
    });

  } catch (error: any) {
    console.error('❌ Stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
