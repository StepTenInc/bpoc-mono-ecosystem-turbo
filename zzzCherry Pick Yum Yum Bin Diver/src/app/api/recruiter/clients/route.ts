import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';

const SERPER_API_KEY = process.env.SERPER_API_KEY;

interface CompanyVerificationResult {
  status: 'verified' | 'suspicious' | 'unverified';
  websiteExists: boolean;
  searchResults: number;
  companyInfo: string | null;
  issues: string[];
  summary: string;
}

async function verifyCompanyWithSerper(
  companyName: string,
  website?: string
): Promise<CompanyVerificationResult> {
  if (!SERPER_API_KEY) {
    return {
      status: 'unverified',
      websiteExists: false,
      searchResults: 0,
      companyInfo: null,
      issues: ['Verification service unavailable'],
      summary: 'Could not verify company — service unavailable',
    };
  }

  try {
    const issues: string[] = [];
    let websiteExists = false;
    let searchResults = 0;
    let companyInfo: string | null = null;

    // Search for the company
    const searchQuery = website 
      ? `"${companyName}" site:${website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}`
      : `"${companyName}" company`;

    const searchResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: searchQuery, num: 5 }),
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      searchResults = searchData.organic?.length || 0;
      
      if (searchResults > 0) {
        // Extract company info from search results
        const firstResult = searchData.organic[0];
        companyInfo = firstResult?.snippet || null;
      }
    }

    // If they provided a website, check if it's reachable
    if (website) {
      try {
        const cleanUrl = website.startsWith('http') ? website : `https://${website}`;
        const siteCheck = await fetch(cleanUrl, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        });
        websiteExists = siteCheck.ok || siteCheck.status === 301 || siteCheck.status === 302;
      } catch {
        websiteExists = false;
        issues.push('Website URL could not be reached');
      }
    }

    // Determine verification status
    let status: 'verified' | 'suspicious' | 'unverified' = 'unverified';
    
    if (searchResults >= 3 && (websiteExists || !website)) {
      status = 'verified';
    } else if (searchResults >= 1 || websiteExists) {
      status = 'unverified'; // Some presence but not enough to verify
    } else if (website && !websiteExists && searchResults === 0) {
      status = 'suspicious';
      issues.push('No online presence found for this company');
    }

    const summary = status === 'verified'
      ? `Company verified: ${searchResults} search results found${websiteExists ? ', website accessible' : ''}`
      : status === 'suspicious'
        ? 'Could not find any online presence for this company — flagged for review'
        : `Limited information found: ${searchResults} search results`;

    return {
      status,
      websiteExists,
      searchResults,
      companyInfo,
      issues,
      summary,
    };
  } catch (error) {
    console.error('Company verification error:', error);
    return {
      status: 'unverified',
      websiteExists: false,
      searchResults: 0,
      companyInfo: null,
      issues: ['Verification failed due to an error'],
      summary: 'Verification failed',
    };
  }
}

/**
 * GET /api/recruiter/clients
 * Fetch all clients for the recruiter's agency
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    
    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter's agency_id
    const { data: recruiter, error: recruiterError } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id, can_manage_clients')
      .eq('user_id', userId)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 });
    }

    // Get agency clients with company details
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('agency_clients')
      .select(`
        *,
        companies (
          id,
          name,
          slug,
          email,
          phone,
          logo_url,
          website,
          industry,
          company_size
        )
      `)
      .eq('agency_id', recruiter.agency_id)
      .order('created_at', { ascending: false });

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    const clientIds = (clients || []).map(c => c.id);

    // Fetch jobs once and compute:
    // - jobCount
    // - activeJobCount
    // - lastContactAt (best-effort: max(client.updated_at/created_at, latest job created_at))
    let jobCounts: Record<string, number> = {};
    let activeJobCounts: Record<string, number> = {};
    let lastJobAtByClient: Record<string, string> = {};
    let placementCounts: Record<string, number> = {};

    if (clientIds.length > 0) {
      const { data: jobs } = await supabaseAdmin
        .from('jobs')
        .select('id, agency_client_id, status, created_at')
        .in('agency_client_id', clientIds);

      const jobIds = (jobs || []).map((j: any) => j.id);
      const jobToClient = new Map<string, string>((jobs || []).map((j: any) => [j.id, j.agency_client_id]));

      for (const j of jobs || []) {
        jobCounts[j.agency_client_id] = (jobCounts[j.agency_client_id] || 0) + 1;
        if (j.status === 'active') {
          activeJobCounts[j.agency_client_id] = (activeJobCounts[j.agency_client_id] || 0) + 1;
        }
        const prev = lastJobAtByClient[j.agency_client_id];
        if (!prev || new Date(j.created_at).getTime() > new Date(prev).getTime()) {
          lastJobAtByClient[j.agency_client_id] = j.created_at;
        }
      }

      // Placements: best-effort count of hired applications (proxy for placements) per client
      if (jobIds.length > 0) {
        const { data: hiredApps } = await supabaseAdmin
          .from('job_applications')
          .select('id, job_id')
          .in('job_id', jobIds)
          .eq('status', 'hired');

        for (const a of hiredApps || []) {
          const clientIdForJob = jobToClient.get((a as any).job_id);
          if (!clientIdForJob) continue;
          placementCounts[clientIdForJob] = (placementCounts[clientIdForJob] || 0) + 1;
        }
      }
    }

    // Format response
    const formattedClients = (clients || []).map(client => ({
      id: client.id,
      agencyId: client.agency_id,
      companyId: client.company_id,
      status: client.status,
      contractStart: client.contract_start,
      contractEnd: client.contract_end,
      contractValue: client.contract_value,
      billingType: client.billing_type,
      primaryContactName: client.primary_contact_name,
      primaryContactEmail: client.primary_contact_email,
      primaryContactPhone: client.primary_contact_phone,
      notes: client.notes,
      createdAt: client.created_at,
      lastContactAt: (() => {
        const cUpdated = (client as any).updated_at || client.created_at;
        const jLast = lastJobAtByClient[client.id];
        if (!jLast) return cUpdated;
        return new Date(jLast).getTime() > new Date(cUpdated).getTime() ? jLast : cUpdated;
      })(),
      company: client.companies ? {
        id: client.companies.id,
        name: client.companies.name,
        slug: client.companies.slug,
        email: client.companies.email,
        phone: client.companies.phone,
        logoUrl: client.companies.logo_url,
        website: client.companies.website,
        industry: client.companies.industry,
        companySize: client.companies.company_size,
      } : null,
      jobCount: jobCounts[client.id] || 0,
      activeJobCount: activeJobCounts[client.id] || 0,
      placementCount: placementCounts[client.id] || 0,
    }));

    return NextResponse.json({ 
      success: true,
      clients: formattedClients,
      total: formattedClients.length,
      permissions: {
        canManageClients: recruiter.can_manage_clients,
      }
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/recruiter/clients
 * Add a new client to the agency
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    
    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Verify recruiter can manage clients
    const { data: recruiter, error: recruiterError } = await supabaseAdmin
      .from('agency_recruiters')
      .select('id, agency_id, can_manage_clients')
      .eq('user_id', userId)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 });
    }

    if (!recruiter.can_manage_clients) {
      return NextResponse.json({ error: 'You don\'t have permission to add clients' }, { status: 403 });
    }

    const body = await request.json();
    const {
      companyName,
      companyEmail,
      companyPhone,
      companyWebsite,
      companyIndustry,
      companySize,
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
      notes,
      clientTimezone,
    } = body;

    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Verify company exists online (background check)
    console.log(`🔍 [CLIENT-ADD] Verifying company: ${companyName}`);
    const verification = await verifyCompanyWithSerper(companyName, companyWebsite);
    console.log(`✅ [CLIENT-ADD] Verification result: ${verification.status} (${verification.searchResults} results)`);

    // Create the company first
    const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: companyName,
        slug: companySlug,
        email: companyEmail || null,
        phone: companyPhone || null,
        website: companyWebsite || null,
        industry: companyIndustry || null,
        company_size: companySize || null,
        verification_status: verification.status,
        verification_data: verification,
        verified_at: verification.status === 'verified' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
    }

    // Create the agency_client relationship
    const { data: client, error: clientError } = await supabaseAdmin
      .from('agency_clients')
      .insert({
        agency_id: recruiter.agency_id,
        company_id: company.id,
        status: 'active',
        primary_contact_name: primaryContactName || null,
        primary_contact_email: primaryContactEmail || null,
        primary_contact_phone: primaryContactPhone || null,
        notes: notes || null,
        added_by: recruiter.id,
        client_timezone: clientTimezone || 'Australia/Sydney',
      })
      .select()
      .single();

    if (clientError) {
      console.error('Error creating client:', clientError);
      // Clean up the company if client creation fails
      await supabaseAdmin.from('companies').delete().eq('id', company.id);
      return NextResponse.json({ error: 'Failed to add client' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      client: {
        id: client.id,
        companyId: company.id,
        companyName: company.name,
        verificationStatus: verification.status,
        verificationSummary: verification.summary,
      }
    });

  } catch (error) {
    console.error('Error adding client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/recruiter/clients
 * Update a client
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    
    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id, can_manage_clients')
      .eq('user_id', userId)
      .single();

    if (!recruiter?.can_manage_clients) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, status, primaryContactName, primaryContactEmail, primaryContactPhone, notes } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (status !== undefined) updateData.status = status;
    if (primaryContactName !== undefined) updateData.primary_contact_name = primaryContactName;
    if (primaryContactEmail !== undefined) updateData.primary_contact_email = primaryContactEmail;
    if (primaryContactPhone !== undefined) updateData.primary_contact_phone = primaryContactPhone;
    if (notes !== undefined) updateData.notes = notes;

    const { error } = await supabaseAdmin
      .from('agency_clients')
      .update(updateData)
      .eq('id', clientId)
      .eq('agency_id', recruiter.agency_id);

    if (error) {
      console.error('Error updating client:', error);
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

