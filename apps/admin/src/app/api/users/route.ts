import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const userType = searchParams.get('userType') || 'all'; // all, candidate, recruiter, admin
    const status = searchParams.get('status') || 'all'; // all, active, suspended, banned

    // Fetch from all user tables and combine
    const [candidatesResult, recruitersResult, adminsResult] = await Promise.all([
      supabase
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
      supabase
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
      supabase
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
        user_type: 'candidate' as const,
        status: c.suspended ? 'suspended' : (c.is_active ? 'active' : 'inactive'),
        created_at: c.created_at,
        last_sign_in_at: null,
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
        user_type: 'recruiter' as const,
        status: r.is_active ? 'active' : 'suspended',
        created_at: r.created_at,
        last_sign_in_at: null,
        metadata: {
          agency_id: agency?.id,
          agency_name: agency?.name || 'Unknown Agency',
          verification_status: r.verification_status,
        },
      };
    });

    // Process admins
    const adminUsers = (adminsResult.data || []).map((a) => ({
      id: a.id,
      email: a.email,
      name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email?.split('@')[0] || 'Admin',
      avatar: a.avatar_url,
      user_type: 'admin' as const,
      status: a.is_active ? 'active' : 'inactive',
      created_at: a.created_at,
      last_sign_in_at: null,
      metadata: {
        role: a.role,
      },
    }));

    // Combine all users
    const allUsers = [...candidateUsers, ...recruiterUsers, ...adminUsers];

    // Apply filters
    let filteredUsers = allUsers;

    if (userType !== 'all') {
      filteredUsers = filteredUsers.filter(u => u.user_type === userType);
    }

    if (status !== 'all') {
      filteredUsers = filteredUsers.filter(u => u.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(u =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower) ||
        (u.metadata.agency_name && u.metadata.agency_name.toLowerCase().includes(searchLower))
      );
    }

    // Sort by created_at
    filteredUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
