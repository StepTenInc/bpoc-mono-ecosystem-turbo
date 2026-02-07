import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

type RawClientRow = {
  id: string;
  status: string;
  agency_id: string;
  company_id: string;
  primary_contact_name?: string | null;
  primary_contact_email?: string | null;
  created_at: string;
  agencies?: { id: string; name: string } | null;
  companies?: { id: string; name: string; industry?: string | null; logo_url?: string | null; website?: string | null; verification_status?: string | null; verification_data?: Record<string, unknown> | null } | null;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    let query = supabaseAdmin
      .from('agency_clients')
      .select(
        `
        id,
        status,
        agency_id,
        company_id,
        primary_contact_name,
        primary_contact_email,
        created_at,
        agencies:agencies ( id, name ),
        companies:companies ( id, name, industry, logo_url, website, verification_status, verification_data )
      `
      )
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Best-effort search (Supabase can't OR across joined tables reliably in all setups)
    if (search) {
      query = query.ilike('status', `%${search}%`);
    }

    const { data: clients, error } = await query;
    if (error) {
      console.error('Admin clients fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    const clientIds = (clients || []).map((c: any) => c.id);

    // Job counts per client
    const jobCountMap: Record<string, number> = {};
    const activeJobCountMap: Record<string, number> = {};

    if (clientIds.length > 0) {
      const { data: jobs } = await supabaseAdmin
        .from('jobs')
        .select('id, agency_client_id, status')
        .in('agency_client_id', clientIds);

      for (const j of (jobs || []) as any[]) {
        const cid = j.agency_client_id as string;
        jobCountMap[cid] = (jobCountMap[cid] || 0) + 1;
        if (j.status === 'active') {
          activeJobCountMap[cid] = (activeJobCountMap[cid] || 0) + 1;
        }
      }
    }

    const formatted = (clients || [])
      .map((row: RawClientRow) => ({
        id: row.id,
        status: row.status,
        createdAt: row.created_at,
        agencyId: row.agency_id,
        agencyName: row.agencies?.name || 'Unknown Agency',
        companyId: row.company_id,
        companyName: row.companies?.name || 'Unnamed Company',
        companyIndustry: row.companies?.industry || null,
        companyLogoUrl: row.companies?.logo_url || null,
        companyWebsite: row.companies?.website || null,
        verificationStatus: row.companies?.verification_status || 'unverified',
        verificationData: row.companies?.verification_data || null,
        primaryContactName: row.primary_contact_name || null,
        primaryContactEmail: row.primary_contact_email || null,
        jobCount: jobCountMap[row.id] || 0,
        activeJobCount: activeJobCountMap[row.id] || 0,
      }))
      .filter((c) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          c.companyName.toLowerCase().includes(q) ||
          c.agencyName.toLowerCase().includes(q) ||
          (c.companyIndustry || '').toLowerCase().includes(q) ||
          (c.primaryContactEmail || '').toLowerCase().includes(q)
        );
      });

    // Calculate stats including verification
    const stats = {
      total: formatted.length,
      active: formatted.filter(c => c.status === 'active').length,
      pending: formatted.filter(c => c.status === 'pending').length,
      verified: formatted.filter(c => c.verificationStatus === 'verified').length,
      unverified: formatted.filter(c => c.verificationStatus === 'unverified').length,
      suspicious: formatted.filter(c => c.verificationStatus === 'suspicious').length,
      totalJobs: formatted.reduce((sum, c) => sum + c.jobCount, 0),
    };

    return NextResponse.json({ clients: formatted, stats });
  } catch (error) {
    console.error('Admin clients API error:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}





