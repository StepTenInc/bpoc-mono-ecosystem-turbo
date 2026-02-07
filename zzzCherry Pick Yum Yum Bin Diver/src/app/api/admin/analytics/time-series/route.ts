import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/admin/analytics/time-series
 * Time-series data for applications and placements over time
 * Supports periods: 7, 30, 90, all
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30';

    // Calculate date range and interval
    const now = new Date();
    let startDate: Date;
    let intervalDays: number;

    switch (period) {
      case '7':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        intervalDays = 1; // Daily
        break;
      case '30':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        intervalDays = 1; // Daily
        break;
      case '90':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 90);
        intervalDays = 7; // Weekly
        break;
      case 'all':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1); // Last year
        intervalDays = 30; // Monthly
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        intervalDays = 1;
    }

    // Fetch applications
    const { data: applications } = await supabaseAdmin
      .from('job_applications')
      .select('id, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Fetch placements (accepted offers)
    const { data: placements } = await supabaseAdmin
      .from('job_offers')
      .select('id, accepted_at')
      .eq('status', 'accepted')
      .gte('accepted_at', startDate.toISOString())
      .order('accepted_at', { ascending: true });

    // Group by date intervals
    const timeSeriesData = generateTimeSeries(
      startDate,
      now,
      intervalDays,
      applications || [],
      placements || []
    );

    return NextResponse.json({
      timeSeries: timeSeriesData,
      period,
      intervalDays,
    });

  } catch (error) {
    console.error('Error fetching time-series analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateTimeSeries(
  startDate: Date,
  endDate: Date,
  intervalDays: number,
  applications: any[],
  placements: any[]
) {
  const timeSeries: Array<{
    date: string;
    applications: number;
    placements: number;
    label: string;
  }> = [];

  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + intervalDays);

    // Count applications in this interval
    const applicationsCount = applications.filter(app => {
      const appDate = new Date(app.created_at);
      return appDate >= currentDate && appDate < nextDate;
    }).length;

    // Count placements in this interval
    const placementsCount = placements.filter(placement => {
      const placementDate = new Date(placement.accepted_at);
      return placementDate >= currentDate && placementDate < nextDate;
    }).length;

    // Format label based on interval
    let label: string;
    if (intervalDays === 1) {
      // Daily - show Mon DD
      label = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (intervalDays === 7) {
      // Weekly - show week of Mon DD
      label = `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      // Monthly - show Mon YYYY
      label = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    timeSeries.push({
      date: currentDate.toISOString().split('T')[0],
      applications: applicationsCount,
      placements: placementsCount,
      label,
    });

    currentDate = nextDate;
  }

  return timeSeries;
}
