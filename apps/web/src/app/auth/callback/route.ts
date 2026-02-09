import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(new URL('/?error=auth_error', request.url))
  }

  let accessToken: string | null = null
  let refreshToken: string | null = null

  if (code) {
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Session exchange error:', exchangeError)
        return NextResponse.redirect(new URL('/?error=session_error', request.url))
      }

      // Capture tokens to pass to candidate app
      accessToken = data.session?.access_token || null
      refreshToken = data.session?.refresh_token || null
    } catch (err) {
      console.error('Unexpected error during auth:', err)
      return NextResponse.redirect(new URL('/?error=unexpected_error', request.url))
    }
  }

  // After auth, redirect to the candidate app (separate Next.js app)
  // In production this would be a different subdomain (e.g., app.bpoc.io)
  const candidateAppUrl = process.env.NEXT_PUBLIC_CANDIDATE_APP_URL || 'http://localhost:3000'

  // Build redirect URL with auth callback route in candidate app
  // Pass tokens via hash fragment (not query params) for security - hash isn't sent to server
  const redirectUrl = new URL('/auth/callback', candidateAppUrl)
  
  if (accessToken && refreshToken) {
    // Use hash fragment to pass tokens (more secure than query params)
    redirectUrl.hash = `access_token=${accessToken}&refresh_token=${refreshToken}&type=recovery`
  }

  console.log('🔄 Auth callback redirecting to candidate app:', redirectUrl.origin)

  return NextResponse.redirect(redirectUrl)
} 