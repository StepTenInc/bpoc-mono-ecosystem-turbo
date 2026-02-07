import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuthToken } from '@/lib/auth/verify-token';

/**
 * GET /api/recruiter/profile
 * Fetch recruiter profile
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    
    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Get recruiter profile with agency info
    const { data: recruiter, error } = await supabaseAdmin
      .from('agency_recruiters')
      .select(`
        *,
        agencies (
          id,
          name,
          slug,
          logo_url,
          website,
          email,
          phone
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error || !recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      profile: {
        id: recruiter.id,
        userId: recruiter.user_id,
        agencyId: recruiter.agency_id,
        email: recruiter.email,
        firstName: recruiter.first_name,
        lastName: recruiter.last_name,
        fullName: recruiter.full_name,
        phone: recruiter.phone,
        avatarUrl: recruiter.avatar_url,
        role: recruiter.role,
        position: recruiter.position,
        linkedIn: recruiter.linkedin_url,
        bio: recruiter.bio,
        isActive: recruiter.is_active,
        canPostJobs: recruiter.can_post_jobs,
        canManageApplications: recruiter.can_manage_applications,
        canInviteRecruiters: recruiter.can_invite_recruiters,
        canManageClients: recruiter.can_manage_clients,
        joinedAt: recruiter.joined_at,
        agency: recruiter.agencies,
      }
    });

  } catch (error) {
    console.error('Error fetching recruiter profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/recruiter/profile
 * Update recruiter profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request);
    const userId = auth.userId;
    
    if (!userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      avatarUrl,
      position,
      linkedIn,
      bio,
    } = body;

    // Build update object (note: full_name is a generated column, don't update it directly)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    // Don't update full_name - it's a generated column in the database
    if (phone !== undefined) updateData.phone = phone;
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;
    if (position !== undefined) updateData.position = position;
    if (linkedIn !== undefined) updateData.linkedin_url = linkedIn;
    if (bio !== undefined) updateData.bio = bio;

    // Update recruiter profile
    const { data: recruiter, error } = await supabaseAdmin
      .from('agency_recruiters')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating recruiter profile:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      profile: {
        id: recruiter.id,
        firstName: recruiter.first_name,
        lastName: recruiter.last_name,
        fullName: recruiter.full_name,
        phone: recruiter.phone,
        avatarUrl: recruiter.avatar_url,
        position: recruiter.position,
        linkedIn: recruiter.linkedin_url,
        bio: recruiter.bio,
      }
    });

  } catch (error) {
    console.error('Error updating recruiter profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

