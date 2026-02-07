import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin-helpers';
import { convertToCSV } from '@/lib/csv-export';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType') || 'all';
    const status = searchParams.get('status') || 'all';

    // Fetch users
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        created_at,
        last_sign_in_at,
        banned_until,
        candidates (
          first_name,
          last_name,
          phone,
          status
        ),
        agency_recruiters (
          is_verified,
          is_active,
          agency:agencies (
            name
          )
        ),
        bpoc_users (
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Process for CSV export
    const exportData = (users || []).map((user) => {
      const candidate = Array.isArray(user.candidates) ? user.candidates[0] : user.candidates;
      const recruiter = Array.isArray(user.agency_recruiters) ? user.agency_recruiters[0] : user.agency_recruiters;
      const bpocUser = Array.isArray(user.bpoc_users) ? user.bpoc_users[0] : user.bpoc_users;

      const userTypeLabel = bpocUser ? 'admin' : recruiter ? 'recruiter' : candidate ? 'candidate' : 'unknown';
      const isBanned = user.banned_until && new Date(user.banned_until) > new Date();

      return {
        'User ID': user.id,
        'Email': user.email,
        'User Type': userTypeLabel,
        'First Name': candidate?.first_name || '',
        'Last Name': candidate?.last_name || '',
        'Phone': candidate?.phone || '',
        'Agency': recruiter?.agency?.name || '',
        'Verified': recruiter?.is_verified ? 'Yes' : 'No',
        'Status': isBanned ? 'Banned' : candidate?.status || (recruiter?.is_active ? 'Active' : 'Inactive'),
        'Created At': new Date(user.created_at).toLocaleString(),
        'Last Sign In': user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never',
      };
    });

    // Filter by type and status if needed
    const filtered = exportData.filter(row => {
      if (userType !== 'all' && row['User Type'] !== userType) return false;
      if (status !== 'all' && row['Status'].toLowerCase() !== status.toLowerCase()) return false;
      return true;
    });

    // Convert to CSV
    const csv = convertToCSV(filtered);

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Export users error:', error);
    return NextResponse.json({ error: 'Failed to export users' }, { status: 500 });
  }
}
