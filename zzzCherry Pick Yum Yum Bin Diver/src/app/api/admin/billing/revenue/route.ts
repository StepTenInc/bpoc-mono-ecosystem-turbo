import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // month, quarter, year, all
    const agencyId = searchParams.get('agencyId'); // optional filter by agency

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(2020, 0, 1); // All time
    }

    // Fetch all placements (hired candidates) with salary info
    let query = supabaseAdmin
      .from('job_applications')
      .select(`
        id,
        created_at,
        updated_at,
        job:jobs (
          id,
          title,
          salary_min,
          salary_max,
          currency,
          agency_client:agency_clients (
            id,
            company:companies (
              id,
              name
            ),
            agency:agencies (
              id,
              name
            )
          )
        ),
        candidate:candidates (
          id,
          first_name,
          last_name,
          email
        ),
        job_offers!inner (
          id,
          salary_offered,
          currency,
          status,
          sent_at
        )
      `)
      .eq('status', 'hired')
      .gte('updated_at', startDate.toISOString())
      .order('updated_at', { ascending: false });

    const { data: placements, error } = await query;

    if (error) {
      console.error('Revenue fetch error:', error);
      throw error;
    }

    // Process placements and calculate revenue
    const processedPlacements = (placements || []).map((placement) => {
      const job = placement.job as any;
      const candidate = placement.candidate as any;
      const offers = Array.isArray(placement.job_offers) ? placement.job_offers : [placement.job_offers];
      const acceptedOffer = offers.find((o: any) => o.status === 'accepted') || offers[0];

      const agency = job?.agency_client?.agency;
      const company = job?.agency_client?.company;

      // Calculate commission (typically 15-25% of annual salary)
      const salaryOffered = acceptedOffer?.salary_offered || job?.salary_max || 0;
      const commissionRate = 0.20; // 20% default
      const commission = salaryOffered * commissionRate;

      return {
        id: placement.id,
        candidateName: `${candidate?.first_name || ''} ${candidate?.last_name || ''}`.trim(),
        candidateEmail: candidate?.email,
        jobTitle: job?.title || 'Unknown Position',
        companyName: company?.name || 'Unknown Company',
        agencyId: agency?.id,
        agencyName: agency?.name || 'Direct',
        salaryOffered,
        currency: acceptedOffer?.currency || job?.currency || 'PHP',
        commission,
        commissionRate,
        placedAt: placement.updated_at,
      };
    });

    // Filter by agency if specified
    let filteredPlacements = processedPlacements;
    if (agencyId) {
      filteredPlacements = processedPlacements.filter(p => p.agencyId === agencyId);
    }

    // Calculate totals by currency
    const revenueByCurrency = filteredPlacements.reduce((acc, p) => {
      const curr = p.currency;
      if (!acc[curr]) {
        acc[curr] = {
          currency: curr,
          totalSalaries: 0,
          totalCommission: 0,
          placements: 0,
        };
      }
      acc[curr].totalSalaries += p.salaryOffered;
      acc[curr].totalCommission += p.commission;
      acc[curr].placements += 1;
      return acc;
    }, {} as Record<string, any>);

    // Calculate revenue by agency
    const revenueByAgency = filteredPlacements.reduce((acc, p) => {
      const agencyKey = p.agencyId || 'direct';
      if (!acc[agencyKey]) {
        acc[agencyKey] = {
          agencyId: p.agencyId,
          agencyName: p.agencyName,
          placements: 0,
          totalCommission: 0,
          avgCommission: 0,
        };
      }
      acc[agencyKey].placements += 1;
      acc[agencyKey].totalCommission += p.commission;
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages
    Object.values(revenueByAgency).forEach((agency: any) => {
      agency.avgCommission = agency.totalCommission / agency.placements;
    });

    // Monthly trend data (last 12 months)
    const monthlyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthPlacements = filteredPlacements.filter(p => {
        const placedDate = new Date(p.placedAt);
        return placedDate >= monthDate && placedDate <= monthEnd;
      });

      const monthRevenue = monthPlacements.reduce((sum, p) => sum + p.commission, 0);

      monthlyTrend.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        placements: monthPlacements.length,
      });
    }

    return NextResponse.json({
      summary: {
        totalPlacements: filteredPlacements.length,
        totalRevenue: filteredPlacements.reduce((sum, p) => sum + p.commission, 0),
        avgCommissionPerPlacement: filteredPlacements.length > 0
          ? filteredPlacements.reduce((sum, p) => sum + p.commission, 0) / filteredPlacements.length
          : 0,
      },
      revenueByCurrency: Object.values(revenueByCurrency),
      revenueByAgency: Object.values(revenueByAgency).sort((a: any, b: any) => b.totalCommission - a.totalCommission),
      monthlyTrend,
      recentPlacements: filteredPlacements.slice(0, 10),
    });

  } catch (error) {
    console.error('Billing revenue API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}
