import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const userType = searchParams.get('userType') || 'all'; // all, candidate, recruiter, admin
    const status = searchParams.get('status') || 'all'; // all, active, suspended, banned

    // Fetch from all user tables and combine
    const [candidatesResult, recruitersResult, adminsResult] = await Promise.all([
      supabaseAdmin
        .from('candidates')
        .select(`
          id,
          email,
          first_name,
          last_name,
          full_name,
          avatar_url,
          is_active,
          suspended,
          suspended_at,
          created_at,
          candidate_profiles (phone)
        `)
        .order('created_at', { ascending: false })
        .limit(100),
      supabaseAdmin
        .from('agency_recruiters')
        .select(`
          id,
          user_id,
          email,
          first_name,
          last_name,
          full_name,
          avatar_url,
          is_active,
          verification_status,
          created_at,
          agency:agencies (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100),
      supabaseAdmin
        .from('bpoc_users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          avatar_url,
          is_active,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (candidatesResult.error) {
      console.error('Candidates fetch error:', candidatesResult.error);
    }
    if (recruitersResult.error) {
      console.error('Recruiters fetch error:', recruitersResult.error);
    }
    if (adminsResult.error) {
      console.error('Admins fetch error:', adminsResult.error);
    }

    // Process candidates
    const candidateUsers = (candidatesResult.data || []).map((c) => {
      const profile = Array.isArray(c.candidate_profiles) ? c.candidate_profiles[0] : c.candidate_profiles;
      return {
        id: c.id,
        email: c.email,
        name: c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email?.split('@')[0] || 'Candidate',
        avatar: c.avatar_url,
        userType: 'candidate' as const,
        status: c.suspended ? 'suspended' : (c.is_active ? 'active' : 'inactive'),
        createdAt: c.created_at,
        lastSignInAt: null,
        metadata: {
          phone: profile?.phone,
        },
      };
    });

    // Process recruiters
    const recruiterUsers = (recruitersResult.data || []).map((r) => {
      const agency = Array.isArray(r.agency) ? r.agency[0] : r.agency;
      return {
        id: r.user_id || r.id,
        email: r.email,
        name: r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.email?.split('@')[0] || 'Recruiter',
        avatar: r.avatar_url,
        userType: 'recruiter' as const,
        status: r.is_active ? 'active' : 'suspended',
        createdAt: r.created_at,
        lastSignInAt: null,
        metadata: {
          agencyId: agency?.id,
          agencyName: agency?.name || 'Unknown Agency',
          verificationStatus: r.verification_status,
        },
      };
    });

    // Process admins
    const adminUsers = (adminsResult.data || []).map((a) => ({
      id: a.id,
      email: a.email,
      name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email?.split('@')[0] || 'Admin',
      avatar: a.avatar_url,
      userType: 'admin' as const,
      status: a.is_active ? 'active' : 'inactive',
      createdAt: a.created_at,
      lastSignInAt: null,
      metadata: {
        role: a.role,
      },
    }));

    // Combine all users
    const allUsers = [...candidateUsers, ...recruiterUsers, ...adminUsers];

    // Apply filters
    let filteredUsers = allUsers;

    if (userType !== 'all') {
      filteredUsers = filteredUsers.filter(u => u.userType === userType);
    }

    if (status !== 'all') {
      filteredUsers = filteredUsers.filter(u => u.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(u =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower) ||
        (u.metadata.agencyName && u.metadata.agencyName.toLowerCase().includes(searchLower))
      );
    }

    // Sort by createdAt
    filteredUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate stats
    const stats = {
      total: allUsers.length,
      candidates: candidateUsers.length,
      recruiters: recruiterUsers.length,
      admins: adminUsers.length,
      active: allUsers.filter(u => u.status === 'active').length,
      suspended: allUsers.filter(u => u.status === 'suspended').length,
      inactive: allUsers.filter(u => u.status === 'inactive').length,
    };

    return NextResponse.json({
      users: filteredUsers,
      stats,
    });

  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
