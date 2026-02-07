import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAdminAction } from '@/lib/admin-audit';
import { getAdminFromSession, requireAdmin } from '@/lib/admin-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Fetch user with all related data
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        created_at,
        last_sign_in_at,
        banned_until,
        deleted_at,
        raw_user_meta_data,
        candidates (
          id,
          first_name,
          last_name,
          avatar_url,
          status,
          phone,
          location,
          resume_url,
          linkedin_url,
          portfolio_url,
          bio,
          skills,
          years_of_experience
        ),
        agency_recruiters (
          id,
          is_verified,
          is_active,
          created_at,
          verified_at,
          agency:agencies (
            id,
            name,
            email,
            logo_url
          )
        ),
        bpoc_users (
          id,
          role,
          permissions
        )
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get activity stats
    const [applicationsResult, notesResult] = await Promise.all([
      // Applications count if candidate
      supabaseAdmin
        .from('job_applications')
        .select('id, status, created_at', { count: 'exact' })
        .eq('candidate_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),

      // Admin notes for this user
      supabaseAdmin
        .from('admin_notes')
        .select('*')
        .eq('entity_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    return NextResponse.json({
      user,
      activity: {
        applications: applicationsResult.data || [],
        applicationCount: applicationsResult.count || 0,
      },
      notes: notesResult.data || [],
    });

  } catch (error) {
    console.error('User detail fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    await requireAdmin();
    const admin = await getAdminFromSession();

    const userId = params.id;
    const body = await request.json();
    const { action } = body; // 'ban', 'unban', 'delete'

    if (!['ban', 'unban', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use: ban, unban, or delete' },
        { status: 400 }
      );
    }

    // Fetch user first
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let result;

    if (action === 'ban') {
      // Ban user for 100 years (effectively permanent)
      const bannedUntil = new Date();
      bannedUntil.setFullYear(bannedUntil.getFullYear() + 100);

      result = await supabaseAdmin
        .from('users')
        .update({ banned_until: bannedUntil.toISOString() })
        .eq('id', userId);

      if (result.error) throw result.error;

      // Log action
      await logAdminAction({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: 'ban_user',
        entityType: 'user',
        entityId: userId,
        entityName: user.email,
        details: { reason: body.reason || 'No reason provided' },
      });

    } else if (action === 'unban') {
      result = await supabaseAdmin
        .from('users')
        .update({ banned_until: null })
        .eq('id', userId);

      if (result.error) throw result.error;

      await logAdminAction({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: 'unban_user',
        entityType: 'user',
        entityId: userId,
        entityName: user.email,
      });

    } else if (action === 'delete') {
      // Soft delete
      result = await supabaseAdmin
        .from('users')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', userId);

      if (result.error) throw result.error;

      await logAdminAction({
        adminId: admin.adminId,
        adminName: admin.adminName,
        action: 'delete_user',
        entityType: 'user',
        entityId: userId,
        entityName: user.email,
        details: { reason: body.reason || 'No reason provided' },
      });
    }

    return NextResponse.json({
      success: true,
      message: `User ${action}ned successfully`,
    });

  } catch (error) {
    console.error('User action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform user action' },
      { status: 500 }
    );
  }
}
