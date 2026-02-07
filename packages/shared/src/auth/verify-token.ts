/**
 * Verify Bearer token and extract user ID
 * For use in internal API routes
 */
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function verifyAuthToken(request: NextRequest): Promise<{ userId: string | null; error?: string }> {
  const authHeader = request.headers.get('Authorization');
  
  // Check environment variables
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('🔐 [video-auth] starting auth verification', { 
    hasAuthHeader: !!authHeader,
    url: request.url,
    envCheck: { hasSupabaseUrl, hasServiceKey },
  });
  
  if (!hasServiceKey) {
    console.error('❌ [video-auth] SUPABASE_SERVICE_ROLE_KEY is not configured!');
  }

  // Try Bearer token first
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('🔐 [video-auth] bearer token found', { tokenLen: token.length });
    
    // Reject obvious bad values
    if (!token || token === 'undefined' || token === 'null' || token.length < 20) {
      console.log('⚠️ [video-auth] bearer token invalid format, falling through to cookie');
      // fall through to cookie-based auth
    } else {
      try {
        // Verify the JWT with Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (!error && user) {
          console.log('✅ [video-auth] bearer ok', { userId: user.id, tokenLen: token.length });
          return { userId: user.id };
        }
        console.log('❌ [video-auth] bearer invalid', { tokenLen: token.length, error: error?.message || 'unknown' });
      } catch (e) {
        console.log('❌ [video-auth] bearer threw', { tokenLen: token.length, error: e instanceof Error ? e.message : 'unknown' });
        // fall through
      }
    }
  } else {
    console.log('⚠️ [video-auth] no Bearer header, trying cookie auth');
  }

  // Try cookie-based session (recommended for same-origin requests)
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) {
      console.log('✅ [video-auth] cookie ok', { userId: user.id });
      return { userId: user.id };
    }
    console.log('❌ [video-auth] cookie auth failed', { error: error?.message || 'no user' });
  } catch (e) {
    console.log('❌ [video-auth] cookie threw', { error: e instanceof Error ? e.message : 'unknown' });
    // ignore and fall back
  }
  
  // Fallback to x-user-id header (for backwards compatibility)
  const userId = request.headers.get('x-user-id');
  if (userId) {
    console.log('✅ [video-auth] x-user-id ok', { userId });
    return { userId };
  }
  
  console.log('❌ [video-auth] all auth methods failed');
  return { userId: null, error: 'Invalid or expired token' };
}
