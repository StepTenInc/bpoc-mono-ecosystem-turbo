/**
 * ERROR LOGGING API
 * 
 * Logs errors from anywhere in the platform
 * Automatically categorizes and assigns severity
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuthToken } from '@/lib/auth/verify-token';
import { supabase } from '@/lib/supabase/admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ErrorLogRequest {
  error_message: string;
  error_code?: string;
  error_stack?: string;
  endpoint?: string;
  http_method?: string;
  request_body?: any;
  response_body?: any;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  external_service?: string;
  external_error_code?: string;
  rate_limit_remaining?: number;
  rate_limit_reset?: string;
}

// Auto-detect category from error
function detectCategory(error: ErrorLogRequest): string {
  const msg = error.error_message.toLowerCase();
  const code = error.error_code?.toLowerCase() || '';
  
  if (error.external_service) return 'external_service';
  if (msg.includes('rate limit') || code.includes('429')) return 'rate_limit';
  if (msg.includes('unauthorized') || msg.includes('forbidden') || code.includes('401') || code.includes('403')) return 'permission';
  if (msg.includes('validation') || msg.includes('invalid')) return 'validation';
  if (msg.includes('database') || msg.includes('postgres') || msg.includes('supabase')) return 'database';
  if (msg.includes('auth') || msg.includes('token') || msg.includes('session')) return 'auth';
  if (error.endpoint?.includes('/api/')) return 'api';
  
  return 'unknown';
}

// Auto-detect severity
function detectSeverity(error: ErrorLogRequest): string {
  const msg = error.error_message.toLowerCase();
  const code = error.error_code?.toLowerCase() || '';
  
  // Critical: Data loss, security, payment issues
  if (msg.includes('data loss') || msg.includes('security') || msg.includes('payment') || msg.includes('billing')) return 'critical';
  
  // High: Auth failures, database errors, external service down
  if (msg.includes('database') || msg.includes('unauthorized') || code.includes('500')) return 'high';
  
  // Medium: Rate limits, validation errors
  if (msg.includes('rate limit') || msg.includes('validation')) return 'medium';
  
  // Low: Minor issues
  if (msg.includes('not found') || code.includes('404')) return 'low';
  
  return 'medium';
}

export async function POST(req: NextRequest) {
  try {
    const body: ErrorLogRequest = await req.json();

    // Get client info
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Auto-detect category and severity
    const category = detectCategory(body);
    const severity = detectSeverity(body);

    // Insert error
    const { data, error } = await supabase
      .from('platform_errors')
      .insert({
        error_message: body.error_message,
        error_code: body.error_code,
        error_stack: body.error_stack,
        category,
        severity,
        status: 'new',
        endpoint: body.endpoint,
        http_method: body.http_method,
        request_body: body.request_body,
        response_body: body.response_body,
        user_id: body.user_id,
        user_email: body.user_email,
        user_role: body.user_role,
        ip_address: ip,
        user_agent: userAgent,
        external_service: body.external_service,
        external_error_code: body.external_error_code,
        rate_limit_remaining: body.rate_limit_remaining,
        rate_limit_reset: body.rate_limit_reset,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to log error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // If critical or high severity, trigger AI analysis immediately
    if (severity === 'critical' || severity === 'high') {
      // Fire and forget - don't block the response
      fetch(`${req.nextUrl.origin}/api/admin/errors/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorId: data.id }),
      }).catch(() => {}); // Ignore failures
    }

    return NextResponse.json({
      success: true,
      errorId: data.id,
      category,
      severity,
    });

  } catch (error: any) {
    console.error('Error logging failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET: Fetch errors with filters
export async function GET(req: NextRequest) {
  try {
    // 1. Verify Admin Auth
    const { userId, error: authError } = await verifyAuthToken(req);
    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Double check admin role
    const { data: adminUser } = await supabase
      .from('bpoc_users')
      .select('role')
      .eq('id', userId)
      .single();

    if (adminUser?.role !== 'admin' && adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('platform_errors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (severity) query = query.eq('severity', severity);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, errors: data });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

