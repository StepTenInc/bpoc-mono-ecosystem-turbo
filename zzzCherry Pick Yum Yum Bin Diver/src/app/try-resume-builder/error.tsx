'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/shared/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to error reporting service
    console.error('Resume Builder Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center space-y-6">
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Something Went Wrong</h1>
            <p className="text-gray-400">
              We encountered an error while processing your resume. Don't worry, your data is safe.
            </p>
          </div>

          {/* Error Details (in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-left">
              <p className="text-red-400 text-sm font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={reset}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            <Link href="/" className="w-full">
              <Button
                variant="outline"
                className="w-full h-12 border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <p className="text-gray-500 text-sm">
            If this problem persists, please contact{' '}
            <a href="mailto:careers@shoreagents.com" className="text-cyan-400 hover:underline">
              careers@shoreagents.com
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
