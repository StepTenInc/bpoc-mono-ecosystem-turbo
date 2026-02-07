import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';

/**
 * GET /api/recruiter/clients/[id]
 * Fetch a single client by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    
    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter's agency
    const { data: recruiter, error: recruiterError } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', userId)
      .single();

    if (recruiterError || !recruiter) {
      console.error('Recruiter lookup error:', {
        error: recruiterError,
        userId,
        clientId: id
      });
      return NextResponse.json({ 
        error: 'Recruiter not found',
        details: recruiterError?.message 
      }, { status: 403 });
    }

    // Debug: Check if client exists and verify agency match
    const { data: clientExists } = await supabaseAdmin
      .from('agency_clients')
      .select('id, agency_id')
      .eq('id', id)
      .single();

    if (!clientExists) {
      console.error('Client does not exist:', { clientId: id });
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (clientExists.agency_id !== recruiter.agency_id) {
      console.error('Agency mismatch:', {
        clientId: id,
        clientAgencyId: clientExists.agency_id,
        recruiterAgencyId: recruiter.agency_id,
        userId
      });
      return NextResponse.json({ 
        error: 'Client not found',
        details: 'Client belongs to a different agency'
      }, { status: 404 });
    }

    // Get client data (fetch separately to avoid join issues)
    const { data: client, error: clientError } = await supabaseAdmin
      .from('agency_clients')
      .select(`
        id,
        status,
        primary_contact_name,
        primary_contact_email,
        primary_contact_phone,
        notes,
        created_at,
        company_id
      `)
      .eq('id', id)
      .eq('agency_id', recruiter.agency_id)
      .single();

    if (clientError) {
      console.error('Client fetch error:', {
        error: clientError,
        clientId: id,
        agencyId: recruiter.agency_id,
        userId
      });
      return NextResponse.json({ 
        error: 'Client not found',
        details: clientError.message 
      }, { status: 404 });
    }

    if (!client) {
      console.error('Client not found:', {
        clientId: id,
        agencyId: recruiter.agency_id,
        userId
      });
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Fetch company separately (more reliable than join)
    let company = null;
    if (client.company_id) {
      const { data: companyData, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('id, name, slug, email, phone, logo_url, website, industry, company_size, description')
        .eq('id', client.company_id)
        .single();
      
      if (companyError) {
        console.error('Company fetch error:', {
          error: companyError,
          companyId: client.company_id,
          clientId: id
        });
        // Don't fail the whole request if company fetch fails, just log it
      } else {
        company = companyData;
      }
    }

    // Get jobs for this client
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('id, title, status, applicants_count, created_at')
      .eq('agency_client_id', id)
      .order('created_at', { ascending: false });

    const jobIds = (jobs || []).map((j: any) => j.id);
    const totalApplicants = (jobs || []).reduce((acc: number, j: any) => acc + (j.applicants_count || 0), 0);
    const activeJobCount = (jobs || []).filter((j: any) => j.status === 'active').length;

    // Placements: best-effort count of hired applications for this client's jobs
    let placementCount = 0;
    if (jobIds.length > 0) {
      const { count } = await supabaseAdmin
        .from('job_applications')
        .select('id', { count: 'exact', head: true })
        .in('job_id', jobIds)
        .eq('status', 'hired');
      placementCount = count || 0;
    }

    // Last activity: best-effort latest among jobs/applications/rooms/client updated
    let lastActivityAt = (client as any).updated_at || client.created_at;
    const newestJobAt = (jobs || [])[0]?.created_at;
    if (newestJobAt && new Date(newestJobAt).getTime() > new Date(lastActivityAt).getTime()) lastActivityAt = newestJobAt;
    if (jobIds.length > 0) {
      const [{ data: latestApp }, { data: latestRoom }] = await Promise.all([
        supabaseAdmin
          .from('job_applications')
          .select('created_at')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabaseAdmin
          .from('video_call_rooms')
          .select('created_at')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      const candidateDates = [latestApp?.created_at, latestRoom?.created_at].filter(Boolean) as string[];
      for (const d of candidateDates) {
        if (new Date(d).getTime() > new Date(lastActivityAt).getTime()) lastActivityAt = d;
      }
    }

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        status: client.status || 'active',
        primaryContactName: client.primary_contact_name,
        primaryContactEmail: client.primary_contact_email,
        primaryContactPhone: client.primary_contact_phone,
        notes: client.notes,
        createdAt: client.created_at,
        company: company ? {
          id: company.id,
          name: company.name,
          slug: company.slug,
          email: company.email,
          phone: company.phone,
          logoUrl: company.logo_url,
          website: company.website,
          industry: company.industry,
          companySize: company.company_size,
          description: company.description,
        } : null,
        // Metrics for a richer UI
        totalApplicants,
        activeJobCount,
        placementCount,
        lastActivityAt,
        jobs: (jobs || []).map(j => ({
          id: j.id,
          title: j.title,
          status: j.status,
          applicantsCount: j.applicants_count || 0,
          createdAt: j.created_at,
        })),
      }
    });

  } catch (error) {
    console.error('Fetch client error:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

/**
 * PATCH /api/recruiter/clients/[id]
 * Update a client
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    
    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter's agency
    const { data: recruiter } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id')
      .eq('user_id', userId)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 403 });
    }

    // Verify client belongs to recruiter's agency
    const { data: existingClient } = await supabaseAdmin
      .from('agency_clients')
      .select('id')
      .eq('id', id)
      .eq('agency_id', recruiter.agency_id)
      .single();

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
      notes,
      status,
    } = body;

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (primaryContactName !== undefined) updateData.primary_contact_name = primaryContactName;
    if (primaryContactEmail !== undefined) updateData.primary_contact_email = primaryContactEmail;
    if (primaryContactPhone !== undefined) updateData.primary_contact_phone = primaryContactPhone;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    // Update client
    const { data: client, error } = await supabaseAdmin
      .from('agency_clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update client error:', error);
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Client updated successfully',
      client
    });

  } catch (error) {
    console.error('Update client error:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

