'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
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
  User,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Rocket,
  Zap,
  Target,
  TrendingUp,
  Heart
} from 'lucide-react'

interface SignUpFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToLogin?: () => void
}

export default function SignUpForm({ open, onOpenChange, onSwitchToLogin }: SignUpFormProps) {
  const { signUp, signIn, signInWithGoogle } = useAuth()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [creationStep, setCreationStep] = useState<'idle' | 'creating' | 'syncing' | 'finalizing' | 'success'>('idle')
  const [error, setError] = useState('')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Please enter your full name')
      return
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email')
      return
    }
    if (!formData.password.trim()) {
      setError('Please enter a password')
      return
    }

    setIsLoading(true)
    setCreationStep('creating')

    try {
      // Check if user exists
      const existsRes = await fetch(`/api/public/users/exists?email=${encodeURIComponent(formData.email)}`)
      if (existsRes.ok) {
        const { exists } = await existsRes.json()
        if (exists) {
          setError('Account already exists. Please sign in instead.')
          setIsLoading(false)
          setCreationStep('idle')
          return
        }
      }

      // Sign up (Creating step)
      await new Promise(resolve => setTimeout(resolve, 800)) // Show animation
      const { data, error: signUpError } = await signUp(
        formData.email,
        formData.password,
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          full_name: `${formData.firstName} ${formData.lastName}`
        }
      )

      if (signUpError) {
        setError(signUpError.message)
        setIsLoading(false)
        setCreationStep('idle')
        return
      }

      if (data.user) {
        // Syncing step
        setCreationStep('syncing')
        await new Promise(resolve => setTimeout(resolve, 600))

        const syncResponse = await fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`,
          })
        })

        if (!syncResponse.ok) {
          const syncError = await syncResponse.json().catch(() => ({}))
          console.error('Database sync failed (non-critical):', syncError)
          // Don't block signup for sync errors - user is authenticated
          // The sync will be retried by AuthContext automatically
        }

        // Finalizing step
        setCreationStep('finalizing')
        await new Promise(resolve => setTimeout(resolve, 500))

        // Auto sign in
        const signInResult = await signIn(formData.email, formData.password)
        if (!signInResult.error) {
          // Check for anonymous session and claim it
          const anonSessionId = localStorage.getItem('anon_session_id')
          if (anonSessionId && signInResult.data?.session?.access_token) {
            try {
              await fetch('/api/anon/claim', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${signInResult.data.session.access_token}`,
                  'x-user-id': signInResult.data.user?.id || ''
                },
                body: JSON.stringify({ anon_session_id: anonSessionId })
              })
              localStorage.removeItem('anon_session_id')
            } catch (error) {
              console.error('Error claiming anonymous session:', error)
            }
          }

          // Success!
          setCreationStep('success')
          await new Promise(resolve => setTimeout(resolve, 800))

          onOpenChange(false)
          // Redirect to dashboard
          window.location.href = '/candidate/dashboard'
        }
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setCreationStep('idle')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    sessionStorage.setItem('googleOAuthFlow', 'signup')
    onOpenChange(false)
    await signInWithGoogle()
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', password: '' })
    setError('')
    setCreationStep('idle')
  }

  // Only render when open
  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm()
      onOpenChange(isOpen)
    }}>
      <DialogContent className="bg-[#0A0A0B] border-white/10 max-w-md w-full mx-4 p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {isLoading && creationStep !== 'idle' ? (
            /* EPIC PRELOADER ANIMATION */
            <motion.div
              key="preloader"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="p-8 space-y-8 min-h-[500px] flex flex-col items-center justify-center"
            >
              {/* Animated Logo with Pulse */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full blur-3xl opacity-60 animate-pulse" />
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-white/20 flex items-center justify-center backdrop-blur-xl">
                  <AnimatedLogo className="w-16 h-16" />
                </div>
              </motion.div>

              {/* Creation Steps */}
              <div className="space-y-4 w-full max-w-xs">
                {/* Step 1: Creating Account */}
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{
                    x: 0,
                    opacity: creationStep === 'creating' || creationStep === 'syncing' || creationStep === 'finalizing' || creationStep === 'success' ? 1 : 0.3
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20"
                >
                  {creationStep === 'creating' ? (
                    <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  )}
                  <div className="flex-1">
                    <p className="text-white font-semibold">Creating Account</p>
                    <p className="text-xs text-gray-400">Setting up your profile...</p>
                  </div>
                  <Rocket className="w-5 h-5 text-cyan-400" />
                </motion.div>

                {/* Step 2: Syncing Data */}
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{
                    x: 0,
                    opacity: creationStep === 'syncing' || creationStep === 'finalizing' || creationStep === 'success' ? 1 : 0.3,
                    transition: { delay: 0.2 }
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20"
                >
                  {creationStep === 'syncing' ? (
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  ) : creationStep === 'finalizing' || creationStep === 'success' ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <Zap className="w-6 h-6 text-gray-600" />
                  )}
                  <div className="flex-1">
                    <p className="text-white font-semibold">Syncing Data</p>
                    <p className="text-xs text-gray-400">Connecting to database...</p>
                  </div>
                  <Zap className="w-5 h-5 text-purple-400" />
                </motion.div>

                {/* Step 3: Finalizing */}
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{
                    x: 0,
                    opacity: creationStep === 'finalizing' || creationStep === 'success' ? 1 : 0.3,
                    transition: { delay: 0.4 }
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
                >
                  {creationStep === 'finalizing' ? (
                    <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
                  ) : creationStep === 'success' ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <Target className="w-6 h-6 text-gray-600" />
                  )}
                  <div className="flex-1">
                    <p className="text-white font-semibold">Finalizing</p>
                    <p className="text-xs text-gray-400">Almost there...</p>
                  </div>
                  <Target className="w-5 h-5 text-green-400" />
                </motion.div>
              </div>

              {/* Success Confetti */}
              {creationStep === 'success' && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center space-y-4"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: 2
                    }}
                  >
                    <Heart className="w-16 h-16 text-pink-500 mx-auto" fill="currentColor" />
                  </motion.div>
                  <div>
                    <p className="text-2xl font-bold text-white">Welcome Aboard!</p>
                    <p className="text-gray-400 text-sm mt-2">Taking you to your dashboard...</p>
                  </div>
                </motion.div>
              )}

              {/* Status Message */}
              {creationStep !== 'success' && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-center"
                >
                  <p className="text-gray-400 text-sm flex items-center gap-2 justify-center">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    {creationStep === 'creating' && 'Creating your account...'}
                    {creationStep === 'syncing' && 'Syncing your data...'}
                    {creationStep === 'finalizing' && 'Finalizing setup...'}
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* FRIENDLY SIGNUP FORM */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 space-y-6"
            >
              {/* Header with Excitement */}
              <DialogHeader className="text-center space-y-4">
                <div className="flex justify-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-60 animate-pulse" />
                    <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-white/20 flex items-center justify-center backdrop-blur-xl">
                      <Sparkles className="w-10 h-10 text-cyan-400" />
                    </div>
                  </motion.div>
                </div>
                <div className="space-y-2">
                  <DialogTitle className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Your Dream Job Awaits!
                  </DialogTitle>
                  <p className="text-gray-300 text-lg font-medium">
                    Join <span className="text-cyan-400 font-black text-xl">12,847+</span> Filipinos who landed amazing BPO careers
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-400 pt-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>100% Free</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>No Credit Card</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>2 Min Setup</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
                >
                  <p className="text-red-400 text-sm text-center font-medium">{error}</p>
                </motion.div>
              )}

              <div className="space-y-5">
                {/* Google Sign Up - Primary */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 border-white/20 bg-white text-black hover:bg-gray-100 font-bold text-base rounded-2xl"
                    onClick={handleGoogleSignUp}
                    disabled={isLoading}
                  >
                    <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                </motion.div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#0A0A0B] px-3 text-gray-500">or with email</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Encouraging Subheader */}
                  <div className="text-center pb-2">
                    <p className="text-gray-400 text-sm">
                      <span className="text-green-400 font-semibold">83% of our users</span> get hired within <span className="text-cyan-400 font-semibold">30 days!</span>
                    </p>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <label className="text-xs text-gray-400 font-medium mb-1.5 block pl-1">First Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                        <Input
                          type="text"
                          placeholder="Juan"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:bg-white/10 rounded-2xl text-base transition-all"
                          disabled={isLoading}
                        />
                        {formData.firstName && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                    <motion.div whileFocus={{ scale: 1.02 }}>
                      <label className="text-xs text-gray-400 font-medium mb-1.5 block pl-1">Last Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                        <Input
                          type="text"
                          placeholder="Dela Cruz"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:bg-white/10 rounded-2xl text-base transition-all"
                          disabled={isLoading}
                        />
                        {formData.lastName && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  {/* Email */}
                  <motion.div whileFocus={{ scale: 1.02 }}>
                    <label className="text-xs text-gray-400 font-medium mb-1.5 block pl-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                      <Input
                        type="email"
                        placeholder="juan@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:bg-white/10 rounded-2xl text-base transition-all"
                        disabled={isLoading}
                      />
                      {formData.email && /\S+@\S+\.\S+/.test(formData.email) && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div whileFocus={{ scale: 1.02 }}>
                    <label className="text-xs text-gray-400 font-medium mb-1.5 block pl-1">Choose Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pl-12 pr-24 h-14 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-cyan-500 focus:bg-white/10 rounded-2xl text-base transition-all"
                        disabled={isLoading}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {formData.password && formData.password.length >= 6 && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          </motion.div>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-500 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-14 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white font-black text-base rounded-2xl shadow-[0_0_30px_rgba(0,217,255,0.4)] relative overflow-hidden group"
                      disabled={isLoading}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative z-10 flex items-center gap-2">
                        <Rocket className="w-5 h-5" />
                        Get Started Free
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    </Button>
                  </motion.div>
                </form>

                {/* Terms Note */}
                <p className="text-center text-gray-500 text-xs leading-relaxed">
                  By signing up, you agree to our{' '}
                  <Link href="/terms-and-conditions" className="text-cyan-400 hover:underline" target="_blank">
                    Terms
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy-policy" className="text-cyan-400 hover:underline" target="_blank">
                    Privacy Policy
                  </Link>
                </p>

                {/* Switch to Login */}
                <p className="text-center text-gray-400 text-sm">
                  Already have an account?{' '}
                  <button onClick={onSwitchToLogin} className="text-cyan-400 hover:underline font-semibold">
                    Sign in
                  </button>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
