import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-helpers';
import { convertToCSV } from '@/lib/csv-export';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';

    // Calculate date range
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
        startDate = new Date(2020, 0, 1);
    }

    // Fetch placements
    const { data: placements, error } = await supabaseAdmin
      .from('job_applications')
      .select(`
        id,
        created_at,
        updated_at,
        job:jobs (
          title,
          salary_max,
          currency,
          agency_client:agency_clients (
            company:companies (
              name
            ),
            agency:agencies (
              name
            )
          )
        ),
        candidate:candidates (
          first_name,
          last_name,
          email
        ),
        job_offers!inner (
          salary_offered,
          currency,
          status
        )
      `)
      .eq('status', 'hired')
      .gte('updated_at', startDate.toISOString());

    if (error) throw error;

    // Process for CSV export
    const exportData = (placements || []).map((placement) => {
      const job = placement.job as any;
      const candidate = placement.candidate as any;
      const offers = Array.isArray(placement.job_offers) ? placement.job_offers : [placement.job_offers];
      const acceptedOffer = offers.find((o: any) => o.status === 'accepted') || offers[0];

      const salaryOffered = acceptedOffer?.salary_offered || job?.salary_max || 0;
      const commission = salaryOffered * 0.20;

      return {
        'Placement ID': placement.id,
        'Candidate Name': `${candidate?.first_name || ''} ${candidate?.last_name || ''}`.trim(),
        'Candidate Email': candidate?.email || '',
        'Job Title': job?.title || 'Unknown',
        'Company': job?.agency_client?.company?.name || 'Unknown',
        'Agency': job?.agency_client?.agency?.name || 'Direct',
        'Salary Offered': salaryOffered,
        'Currency': acceptedOffer?.currency || job?.currency || 'PHP',
        'Commission (20%)': commission,
        'Placed At': new Date(placement.updated_at).toLocaleString(),
      };
    });

    // Convert to CSV
    const csv = convertToCSV(exportData);

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="revenue_export_${period}_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Export revenue error:', error);
    return NextResponse.json({ error: 'Failed to export revenue data' }, { status: 500 });
  }
}
