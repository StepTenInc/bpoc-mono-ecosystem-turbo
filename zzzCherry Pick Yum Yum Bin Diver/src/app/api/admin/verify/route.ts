import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json(
        { error: 'No access token provided' },
        { status: 401 }
      );
    }

    // Verify the token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(access_token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is a BPOC admin using admin client (bypasses RLS)
    const { data: bpocUser, error: bpocError } = await supabaseAdmin
      .from('bpoc_users')
      .select('id, email, first_name, last_name, role, is_active')
      .eq('id', user.id)
      .single();

    if (bpocError || !bpocUser) {
      return NextResponse.json(
        { error: 'Not an admin user', isAdmin: false },
        { status: 403 }
      );
    }

    if (!bpocUser.is_active) {
      return NextResponse.json(
        { error: 'Account deactivated', isAdmin: false },
        { status: 403 }
      );
    }

    return NextResponse.json({
      isAdmin: true,
      user: bpocUser
    });

  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json(
      { error: 'Verification failed', isAdmin: false },
      { status: 500 }
    );
  }
}

