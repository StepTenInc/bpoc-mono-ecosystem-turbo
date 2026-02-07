import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/matches/stats
 * Get overall match statistics for admin dashboard
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify admin authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get total matches count
        const { count: totalMatches } = await supabaseAdmin
            .from('job_matches')
            .select('*', { count: 'exact', head: true });

        // Get average score
        const { data: avgData } = await supabaseAdmin
            .rpc('get_avg_match_score');

        // Get high quality matches (score >= 80)
        const { count: highQualityMatches } = await supabaseAdmin
            .from('job_matches')
            .select('*', { count: 'exact', head: true })
            .gte('overall_score', 80);

        // Get match score distribution
        const { data: scoreDistribution } = await supabaseAdmin
            .from('job_matches')
            .select('overall_score');

        // Calculate distribution buckets
        const buckets = {
            '0-20': 0,
            '21-40': 0,
            '41-60': 0,
            '61-80': 0,
            '81-100': 0,
        };

        scoreDistribution?.forEach(match => {
            const score = match.overall_score;
            if (score <= 20) buckets['0-20']++;
            else if (score <= 40) buckets['21-40']++;
            else if (score <= 60) buckets['41-60']++;
            else if (score <= 80) buckets['61-80']++;
            else buckets['81-100']++;
        });

        // Get top performing jobs (jobs with most high-quality matches)
        const { data: topJobs } = await supabaseAdmin
            .from('job_matches')
            .select(`
        job_id,
        overall_score,
        jobs (
          id,
          title
        )
      `)
            .gte('overall_score', 80)
            .limit(1000);

        // Group by job
        const jobMatchCounts = new Map();
        topJobs?.forEach(match => {
            const jobId = match.job_id;
            if (!jobMatchCounts.has(jobId)) {
                jobMatchCounts.set(jobId, {
                    job_id: jobId,
                    job_title: match.jobs?.title || 'Unknown',
                    count: 0,
                });
            }
            jobMatchCounts.get(jobId).count++;
        });

        const topPerformingJobs = Array.from(jobMatchCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Get recent matches
        const { data: recentMatches } = await supabaseAdmin
            .from('job_matches')
            .select(`
        created_at,
        overall_score,
        candidates (first_name, last_name),
        jobs (title)
      `)
            .order('created_at', { ascending: false })
            .limit(10);

        // Estimate cost (assuming $0.0001 per match with Groq)
        const costPerMatch = 0.0001;
        const estimatedCost = (totalMatches || 0) * costPerMatch;

        return NextResponse.json({
            success: true,
            stats: {
                total_matches: totalMatches || 0,
                average_score: avgData?.[0]?.avg || 0,
                high_quality_matches: highQualityMatches || 0,
                high_quality_percentage: totalMatches
                    ? ((highQualityMatches || 0) / totalMatches * 100).toFixed(1)
                    : 0,
                score_distribution: buckets,
                top_performing_jobs: topPerformingJobs,
                recent_matches: recentMatches || [],
                estimated_cost: estimatedCost.toFixed(4),
                cost_currency: 'USD',
            },
        });
    } catch (error: any) {
        console.error('Error fetching match stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics', details: error.message },
            { status: 500 }
        );
    }
}
