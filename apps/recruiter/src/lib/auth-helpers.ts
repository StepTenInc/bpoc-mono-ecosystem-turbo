import { createClient } from './supabase/client'
import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Verify recruiter authentication from API route request
export async function verifyRecruiterAuth(request: NextRequest): Promise<{
  isValid: boolean
  error?: string
  recruiterId?: string
  userId?: string
}> {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { isValid: false, error: 'Not authenticated' }
    }

    // Check if user is a recruiter
    const { data: recruiter } = await supabase
      .from('agency_recruiters')
      .select('id, agency_id, role')
      .eq('user_id', user.id)
      .single()

    if (!recruiter) {
      return { isValid: false, error: 'Not a recruiter' }
    }

    return {
      isValid: true,
      recruiterId: recruiter.id,
      userId: user.id,
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { isValid: false, error: 'Authentication failed' }
  }
}

// Use the SSR browser client to ensure we're reading from the same auth state
// as the AuthContext (which also uses createClient from supabase/client)
export async function getSessionToken(): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      console.log('⚠️ No session token found in getSessionToken')
    }
    return session?.access_token || null
  } catch (error) {
    console.error('Error getting session token:', error)
    return null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

export async function getUserId(): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  } catch (error) {
    console.error('Error getting user id:', error)
    return null
  }
}

export function handleRefreshTokenError(error: any): void {
  if (error?.message?.includes('refresh token') || error?.message?.includes('Invalid Refresh Token')) {
    console.log('🧹 Refresh token error detected, clearing storage')
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
      // Optionally redirect to login page
      window.location.href = '/'
    }
  }
}

export async function safeGetSession(): Promise<any> {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      handleRefreshTokenError(error)
      return { session: null, error }
    }
    return { session, error: null }
  } catch (error) {
    handleRefreshTokenError(error)
    return { session: null, error }
  }
} 