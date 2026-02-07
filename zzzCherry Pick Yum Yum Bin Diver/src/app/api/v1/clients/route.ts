import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateApiKey } from '../auth';
import { handleCorsOptions, withCors } from '../cors';
import { transformToApi } from '@/lib/api/transform';

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return handleCorsOptions();
}

/**
 * GET /api/v1/clients
 * List all clients for the agency
 * 
 * Returns the clientId needed for creating jobs
 */
export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if ('error' in auth) {
    return withCors(NextResponse.json({ error: auth.error }, { status: auth.status }));
  }

  try {
    // agency_clients links to companies table for company details
    const { data: clients, error } = await supabaseAdmin
      .from('agency_clients')
      .select(`
        id,
        status,
        contract_start,
        contract_end,
        primary_contact_name,
        primary_contact_email,
        created_at,
        companies (
          id,
          name,
          industry,
          website,
          logo_url
        )
      `)
      .eq('agency_id', auth.agencyId);

    if (error) {
      console.error('Clients fetch error:', error);
      return withCors(NextResponse.json({ error: 'Failed to fetch clients', details: error.message }, { status: 500 }));
    }

    // Format with company details (using snake_case, then transform)
    const formattedClients = (clients || []).map((c: any) => ({
      id: c.id, // This is the agency_client id - use this for creating jobs
      company_id: c.companies?.id,
      name: c.companies?.name || 'Unnamed Client',
      industry: c.companies?.industry || null,
      website: c.companies?.website || null,
      logo_url: c.companies?.logo_url || null,
      status: c.status,
      contact_name: c.primary_contact_name || null,
      contact_email: c.primary_contact_email || null,
      contract_start: c.contract_start,
      contract_end: c.contract_end,
      created_at: c.created_at,
    }));

    return withCors(NextResponse.json(transformToApi({
      clients: formattedClients,
      total: formattedClients.length,
      note: 'Use the "id" field as clientId when creating jobs via API',
    })));

  } catch (error) {
    console.error('API v1 clients error:', error);
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }));
  }
}
