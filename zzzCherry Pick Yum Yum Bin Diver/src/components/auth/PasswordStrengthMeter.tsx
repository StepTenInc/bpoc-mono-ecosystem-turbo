'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordStrengthMeterProps {
  password: string
}

interface StrengthResult {
  score: number // 0-4
  label: string
  color: string
  bgColor: string
  textColor: string
  checks: {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
    hasSpecial: boolean
  }
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = useMemo<StrengthResult>(() => {
    const checks = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    }

    // Calculate score based on checks
    let score = 0
    if (checks.minLength) score++
    if (checks.hasUppercase) score++
    if (checks.hasLowercase) score++
    if (checks.hasNumber) score++
    if (checks.hasSpecial) score++

    // Determine label and colors
    if (score === 0 || password.length === 0) {
      return {
        score: 0,
        label: '',
        color: 'bg-gray-700',
        bgColor: 'bg-gray-800',
        textColor: 'text-gray-500',
        checks,
      }
    } else if (score <= 2) {
      return {
        score: 1,
        label: 'Weak',
        color: 'bg-red-500',
        bgColor: 'bg-red-500/20',
        textColor: 'text-red-400',
        checks,
      }
    } else if (score === 3) {
      return {
        score: 2,
        label: 'Medium',
        color: 'bg-orange-500',
        bgColor: 'bg-orange-500/20',
        textColor: 'text-orange-400',
        checks,
      }
    } else if (score === 4) {
      return {
        score: 3,
        label: 'Strong',
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-500/20',
        textColor: 'text-yellow-400',
        checks,
      }
    } else {
      return {
        score: 4,
        label: 'Very Strong',
        color: 'bg-green-500',
        bgColor: 'bg-green-500/20',
        textColor: 'text-green-400',
        checks,
      }
    }
  }, [password])

  if (password.length === 0) {
    return null
  }

  const barWidth = (strength.score / 4) * 100

  return (
    <div className="space-y-3 mt-2">
      {/* Strength Bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Password Strength</span>
          {strength.label && (
            <span className={cn("text-xs font-medium", strength.textColor)}>
              {strength.label}
            </span>
          )}
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", strength.color)}
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className={cn(
        "p-3 rounded-lg border text-xs space-y-1.5",
        strength.bgColor,
        strength.score === 0 ? 'border-gray-700' : 'border-transparent'
      )}>
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3 text-gray-400" />
          <span className="text-gray-300 font-medium">Password Requirements</span>
        </div>
        
        <div className="grid grid-cols-1 gap-1">
          <CheckItem checked={strength.checks.minLength} label="At least 8 characters" />
          <CheckItem checked={strength.checks.hasUppercase} label="One uppercase letter (A-Z)" />
          <CheckItem checked={strength.checks.hasLowercase} label="One lowercase letter (a-z)" />
          <CheckItem checked={strength.checks.hasNumber} label="One number (0-9)" />
          <CheckItem checked={strength.checks.hasSpecial} label="One special character (!@#$%)" />
        </div>
      </div>
    </div>
  )
}

function CheckItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {checked ? (
        <CheckCircle className="w-3 h-3 text-green-400" />
      ) : (
        <XCircle className="w-3 h-3 text-gray-600" />
      )}
      <span className={checked ? 'text-gray-300' : 'text-gray-500'}>{label}</span>
    </div>
  )
}
