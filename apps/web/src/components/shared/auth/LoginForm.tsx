'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog'
import { AnimatedLogo } from '@/components/shared/ui/AnimatedLogo'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react'
import { requestPasswordReset } from '@/lib/supabase'

interface LoginFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignUp?: () => void
}

export default function LoginForm({ open, onOpenChange, onSwitchToSignUp }: LoginFormProps) {
  const { signIn, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (mode === 'forgot') {
      await handleResetPassword()
      return
    }

    // Validation
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const { data, error: signInError } = await signIn(email, password)
      
      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please confirm your email first')
        } else {
          setError(signInError.message)
        }
        setIsLoading(false)
        return
      }

      if (data.user) {
        // Check for anonymous session and claim it
        const anonSessionId = localStorage.getItem('anon_session_id')
        if (anonSessionId && data.session?.access_token) {
          try {
            const claimResponse = await fetch('/api/anon/claim', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.session.access_token}`,
                'x-user-id': data.user.id
              },
              body: JSON.stringify({ anon_session_id: anonSessionId })
            })

            if (claimResponse.ok) {
              const claimResult = await claimResponse.json()
              console.log('✅ Successfully claimed anonymous session:', claimResult)
              localStorage.removeItem('anon_session_id')
            } else {
              console.warn('Failed to claim anonymous session:', await claimResponse.text())
            }
          } catch (claimError) {
            console.error('Error claiming anonymous session:', claimError)
            // Continue with redirect even if claim fails
          }
        }

        sessionStorage.removeItem('justSignedUp')
        sessionStorage.removeItem('googleOAuthFlow')
        sessionStorage.setItem('hasSignedIn', 'true')

        const adminLevel = data.user.user_metadata?.admin_level || data.user.user_metadata?.role
        const isRecruiter = adminLevel === 'recruiter' || adminLevel === 'admin'

        onOpenChange(false)
        resetForm()

        window.location.href = isRecruiter ? '/recruiter/dashboard' : '/candidate/dashboard'
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    sessionStorage.removeItem('justSignedUp')
    sessionStorage.setItem('hasSignedIn', 'true')
    onOpenChange(false)
    await signInWithGoogle()
    setIsLoading(false)
  }

  const handleResetPassword = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email')
      return
    }

    setIsLoading(true)
    try {
      const { error: resetError } = await requestPasswordReset(email)
      if (resetError) {
        setError(resetError.message || 'Failed to send reset email')
      } else {
        setResetSent(true)
      }
    } catch {
      setError('Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError('')
    setMode('login')
    setResetSent(false)
  }

  // Only render when open to prevent unnecessary re-renders
  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm()
      onOpenChange(isOpen)
    }}>
      <DialogContent className="bg-[#0A0A0B] border-white/10 max-w-md w-full mx-4 p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 space-y-6"
        >
          {/* Header */}
          <DialogHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                <AnimatedLogo className="w-8 h-8" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-white">
              {mode === 'login' ? 'Welcome Back' : resetSent ? 'Check Your Email' : 'Reset Password'}
            </DialogTitle>
            <p className="text-gray-400 text-sm">
              {mode === 'login' 
                ? 'Sign in to continue your BPO career journey'
                : resetSent 
                  ? 'We sent a password reset link to your email'
                  : 'Enter your email to receive a reset link'
              }
            </p>
          </DialogHeader>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Reset Sent Success */}
          {resetSent ? (
            <div className="space-y-5">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <p className="text-green-400 text-sm">✓ Reset link sent to {email}</p>
              </div>
              <Button
                onClick={() => { setMode('login'); setResetSent(false); }}
                className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </div>
          ) : mode === 'forgot' ? (
            /* Forgot Password Mode */
            <div className="space-y-5">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500"
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode('login')}
                  className="flex-1 h-12 border-white/10 text-white hover:bg-white/5"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={isLoading}
                  className="flex-1 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-medium"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Link'}
                </Button>
              </div>
            </div>
          ) : (
            /* Login Mode */
            <div className="space-y-5">
              {/* Google Sign In - Primary Option */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-white/20 bg-white/5 text-white hover:bg-white/10 font-medium"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#0A0A0B] px-3 text-gray-500">or sign in with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500"
                    disabled={isLoading}
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="pl-10 pr-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-cyan-500"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button 
                    type="button" 
                    onClick={() => setMode('forgot')}
                    className="text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Sign In
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-gray-500 text-xs">
                Don't have an account?{' '}
                <button onClick={onSwitchToSignUp} className="text-cyan-400 hover:underline">
                  Create one free
                </button>
              </p>
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
