import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';

/**
 * GET /api/recruiter/agency
 * Fetch the recruiter's agency details including profile
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
      .select('agency_id, role, can_manage_clients')
      .eq('user_id', userId)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 });
    }

    // Get agency details
    const { data: agency, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .select('*')
      .eq('id', recruiter.agency_id)
      .single();

    if (agencyError || !agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Get agency profile (extended details)
    const { data: agencyProfile } = await supabaseAdmin
      .from('agency_profiles')
      .select('*')
      .eq('agency_id', recruiter.agency_id)
      .single();

    // Get team count
    const { count: teamCount } = await supabaseAdmin
      .from('agency_recruiters')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', recruiter.agency_id);

    // Get client count
    const { count: clientCount } = await supabaseAdmin
      .from('agency_clients')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', recruiter.agency_id);

    return NextResponse.json({ 
      success: true,
      agency: {
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
        email: agency.email,
        phone: agency.phone,
        website: agency.website,
        logo_url: agency.logo_url,
        logo_symbol_url: agency.logo_symbol_url,
        logo_stacked_url: agency.logo_stacked_url,
        logo_landscape_url: agency.logo_landscape_url,
        description: agency.description,
        address: agency.address,
        city: agency.city,
        country: agency.country,
        is_active: agency.is_active,
        isVerified: agency.is_verified || false,
        api_key: agency.api_key,
        api_enabled: agency.api_enabled,
        created_at: agency.created_at,
        tinNumber: agency.tin_number,
        secRegistrationUrl: agency.sec_registration_url,
        dtiCertificateUrl: agency.dti_certificate_url,
        businessPermitUrl: agency.business_permit_url,
        documentsVerified: agency.documents_verified,
        documentsUploadedAt: agency.documents_uploaded_at,
        documentExpiryDate: agency.document_expiry_date,
        businessPermitExpiry: agency.business_permit_expiry,
        secRegistrationNumber: agency.sec_registration_number,
        documentVerification: agency.document_verification,
      },
      profile: agencyProfile ? {
        id: agencyProfile.id,
        foundedYear: agencyProfile.founded_year,
        employeeCount: agencyProfile.employee_count,
        addressLine1: agencyProfile.address_line1,
        addressLine2: agencyProfile.address_line2,
        city: agencyProfile.city,
        state: agencyProfile.state,
        country: agencyProfile.country,
        postalCode: agencyProfile.postal_code,
        linkedInUrl: agencyProfile.linkedin_url,
        facebookUrl: agencyProfile.facebook_url,
        twitterUrl: agencyProfile.twitter_url,
        settings: agencyProfile.settings,
        branding: agencyProfile.branding,
      } : null,
      stats: {
        teamCount: teamCount || 0,
        clientCount: clientCount || 0,
      },
      permissions: {
        role: recruiter.role,
        canManageAgency: recruiter.role === 'admin' || recruiter.role === 'owner',
        canManageClients: recruiter.can_manage_clients,
      }
    });

  } catch (error) {
    console.error('Error fetching agency:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/recruiter/agency
 * Update agency details and profile (admin/owner only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    
    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin/owner of their agency
    const { data: recruiter, error: recruiterError } = await supabaseAdmin
      .from('agency_recruiters')
      .select('agency_id, role')
      .eq('user_id', userId)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 });
    }

    if (recruiter.role !== 'admin' && recruiter.role !== 'owner') {
      return NextResponse.json({ error: 'Only agency admins can update agency details' }, { status: 403 });
    }

    const body = await request.json();
    const {
      // Agency table fields
      name,
      email,
      phone,
      website,
      logo_url,
      logo_symbol_url,
      logo_stacked_url,
      logo_landscape_url,
      description,
      address,
      city,
      country,
      // Agency profile fields
      foundedYear,
      employeeCount,
      addressLine1,
      addressLine2,
      state,
      postalCode,
      linkedInUrl,
      facebookUrl,
      twitterUrl,
    } = body;

    // Update agency table
    const agencyUpdateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      agencyUpdateData.name = name;
      agencyUpdateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (email !== undefined) agencyUpdateData.email = email;
    if (phone !== undefined) agencyUpdateData.phone = phone;
    if (website !== undefined) agencyUpdateData.website = website;
    if (logo_url !== undefined) agencyUpdateData.logo_url = logo_url;
    if (logo_symbol_url !== undefined) {
      agencyUpdateData.logo_symbol_url = logo_symbol_url;
      // Also update main logo_url if not set
      if (!agencyUpdateData.logo_url) agencyUpdateData.logo_url = logo_symbol_url;
    }
    if (logo_stacked_url !== undefined) agencyUpdateData.logo_stacked_url = logo_stacked_url;
    if (logo_landscape_url !== undefined) agencyUpdateData.logo_landscape_url = logo_landscape_url;
    if (description !== undefined) agencyUpdateData.description = description;
    if (address !== undefined) agencyUpdateData.address = address;
    if (city !== undefined) agencyUpdateData.city = city;
    if (country !== undefined) agencyUpdateData.country = country;

    const { data: agency, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .update(agencyUpdateData)
      .eq('id', recruiter.agency_id)
      .select()
      .single();

    if (agencyError) {
      console.error('Error updating agency:', agencyError);
      return NextResponse.json({ error: 'Failed to update agency' }, { status: 500 });
    }

    // Update or create agency_profile
    const profileUpdateData: any = {
      agency_id: recruiter.agency_id,
      updated_at: new Date().toISOString(),
    };

    if (foundedYear !== undefined) profileUpdateData.founded_year = foundedYear;
    if (employeeCount !== undefined) profileUpdateData.employee_count = employeeCount;
    if (addressLine1 !== undefined) profileUpdateData.address_line1 = addressLine1;
    if (addressLine2 !== undefined) profileUpdateData.address_line2 = addressLine2;
    if (state !== undefined) profileUpdateData.state = state;
    if (postalCode !== undefined) profileUpdateData.postal_code = postalCode;
    if (linkedInUrl !== undefined) profileUpdateData.linkedin_url = linkedInUrl;
    if (facebookUrl !== undefined) profileUpdateData.facebook_url = facebookUrl;
    if (twitterUrl !== undefined) profileUpdateData.twitter_url = twitterUrl;
    // Also store city/country in profile for complete address
    if (city !== undefined) profileUpdateData.city = city;
    if (country !== undefined) profileUpdateData.country = country;

    // Upsert agency profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('agency_profiles')
      .upsert(profileUpdateData, { onConflict: 'agency_id' })
      .select()
      .single();

    if (profileError) {
      console.error('Error updating agency profile:', profileError);
      // Don't fail the whole request if profile update fails
    }

    return NextResponse.json({ 
      success: true,
      agency: {
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
        email: agency.email,
        phone: agency.phone,
        website: agency.website,
        logo_url: agency.logo_url,
        description: agency.description,
      },
      profile: profile || null,
    });

  } catch (error) {
    console.error('Error updating agency:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
