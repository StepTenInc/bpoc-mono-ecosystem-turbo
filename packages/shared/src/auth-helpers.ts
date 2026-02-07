import { createClient } from './supabase/client'

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