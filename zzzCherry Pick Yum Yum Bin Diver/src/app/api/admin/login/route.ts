import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Create a regular supabase client for auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      );
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { error: 'Login failed' },
        { status: 401 }
      );
    }

    // 2. Check if user is a BPOC admin using admin client (bypasses RLS)
    const { data: bpocUser, error: bpocError } = await supabaseAdmin
      .from('bpoc_users')
      .select('id, email, first_name, last_name, role, is_active')
      .eq('id', authData.user.id)
      .single();

    if (bpocError) {
      console.error('BPOC user lookup error:', bpocError);
      return NextResponse.json(
        { error: 'Access denied. Admin account required.' },
        { status: 403 }
      );
    }

    if (!bpocUser) {
      return NextResponse.json(
        { error: 'Access denied. Admin account required.' },
        { status: 403 }
      );
    }

    if (!bpocUser.is_active) {
      return NextResponse.json(
        { error: 'Your account has been deactivated.' },
        { status: 403 }
      );
    }

    // Success - return session info
    return NextResponse.json({
      success: true,
      user: bpocUser,
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    );
  }
}

