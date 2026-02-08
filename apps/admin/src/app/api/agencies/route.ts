import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Fetch agencies with their profiles and counts
    let query = supabase
      .from('agencies')
      .select(`
        id,
        name,
        slug,
        email,
        phone,
        logo_url,
        website,
        is_active,
        is_verified,
        documents_verified,
        documents_uploaded_at,
        document_verification,
        tin_number,
        address,
        city,
        created_at,
        agency_profiles (
          description,
          city,
          country,
          founded_year
        )
      `)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: agencies, error } = await query;

    if (error) {
      console.error('Agencies fetch error:', error);
      throw error;
    }

    // Get recruiter and job counts for each agency
    const agenciesWithCounts = await Promise.all(
      (agencies || []).map(async (agency) => {
        const [recruitersResult, jobsResult] = await Promise.all([
          supabase
            .from('agency_recruiters')
            .select('id', { count: 'exact', head: true })
            .eq('agency_id', agency.id)
            .eq('is_active', true),
          supabase
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .eq('agency_id', agency.id)
            .eq('status', 'active')
        ]);

        // Determine verification status
        let verificationStatus = 'no_documents';
        if (agency.is_verified && agency.documents_verified) {
          verificationStatus = 'verified';
        } else if (agency.documents_uploaded_at && agency.document_verification) {
          const docVerification = agency.document_verification as Record<string, unknown>;
          verificationStatus = (docVerification.overallStatus as string)?.toLowerCase() === 'verified'
            ? 'auto_verified'
            : (docVerification.overallStatus as string)?.toLowerCase() === 'needs_review'
              ? 'needs_review'
              : 'rejected';
        } else if (agency.documents_uploaded_at) {
          verificationStatus = 'documents_uploaded';
        }

        return {
          ...agency,
          recruitersCount: recruitersResult.count || 0,
          activeJobsCount: jobsResult.count || 0,
          status: agency.is_active ? 'active' : 'inactive',
          verificationStatus,
          location: agency.agency_profiles?.[0]?.city && agency.agency_profiles?.[0]?.country
            ? `${agency.agency_profiles[0].city}, ${agency.agency_profiles[0].country}`
            : agency.city || 'No location',
        };
      })
    );

    return NextResponse.json({ agencies: agenciesWithCounts });

  } catch (error) {
    console.error('Agencies API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agencies' },
      { status: 500 }
    );
  }
}

