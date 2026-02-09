'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Authenticating...')

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get tokens from hash fragment (passed from web app)
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          // Set the session using the tokens from the web app
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            console.error('Failed to set session:', error)
            setStatus('Authentication failed. Redirecting...')
            setTimeout(() => router.push('/?error=session_error'), 2000)
            return
          }

          console.log('✅ Session established in candidate app')
          setStatus('Success! Redirecting to dashboard...')
          
          // Clear the hash from URL for cleaner navigation
          window.history.replaceState(null, '', '/auth/callback')
          
          // Redirect to dashboard
          router.push('/dashboard')
        } else {
          // No tokens in hash - might be a direct OAuth callback
          // Check if we already have a session
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
            router.push('/dashboard')
          } else {
            setStatus('No authentication data found. Redirecting...')
            setTimeout(() => router.push('/'), 2000)
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setStatus('Authentication error. Redirecting...')
        setTimeout(() => router.push('/?error=auth_error'), 2000)
      }
    }

    handleAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
}
