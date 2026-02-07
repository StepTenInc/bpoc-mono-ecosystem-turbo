/**
 * Profile Completion Calculator
 * Calculates accurate completion percentage and provides encouraging messages
 */

export interface ProfileCompletionResult {
  percentage: number
  completedFields: number
  totalFields: number
  missingFields: string[]
  encouragingMessage: string
  nextStep: string
}

/**
 * Calculate profile completion percentage
 * Each field is weighted based on importance
 */
export function calculateProfileCompletion(
  candidate: any,
  profile: any
): ProfileCompletionResult {
  const fields = [
    // Basic Info (20 points) - Auto-filled from signup
    { key: 'first_name', source: candidate, points: 10, label: 'First Name' },
    { key: 'last_name', source: candidate, points: 10, label: 'Last Name' },

    // Essential Contact (15 points)
    { key: 'phone', source: profile, points: 10, label: 'Phone Number' },
    { key: 'location', source: profile, points: 5, label: 'Location' },

    // Profile Identity (25 points)
    { key: 'avatar_url', source: candidate, points: 10, label: 'Profile Photo' }, // FIXED: was checking profile, now checks candidate
    { key: 'cover_photo', source: profile, points: 10, label: 'Cover Photo' },
    { key: 'bio', source: profile, points: 5, label: 'Bio' },

    // Work Info (30 points)
    { key: 'position', source: profile, points: 5, label: 'Desired Position' },
    { key: 'work_status', source: profile, points: 5, label: 'Work Status' },
    { key: 'preferred_shift', source: profile, points: 5, label: 'Preferred Shift' },
    { key: 'preferred_work_setup', source: profile, points: 5, label: 'Work Setup Preference' },
    { key: 'expected_salary_min', source: profile, points: 5, label: 'Expected Salary Min' },
    { key: 'expected_salary_max', source: profile, points: 5, label: 'Expected Salary Max' },

    // Personal Details (10 points)
    { key: 'birthday', source: profile, points: 5, label: 'Birthday' },
    { key: 'gender', source: profile, points: 5, label: 'Gender' },

    // Note: Social links (website, linkedin, github, etc.) are NOT included
    // Note: current_mood is optional and NOT included
  ]

  let totalPoints = 0
  let earnedPoints = 0
  const missingFields: string[] = []

  fields.forEach(field => {
    totalPoints += field.points
    const value = field.source?.[field.key]

    const hasValue = value && value !== '' && value !== null && value !== undefined
    if (hasValue) {
      earnedPoints += field.points
    } else {
      missingFields.push(field.label)
    }

    // Debug logging
    console.log(`📋 Field check: ${field.label} (${field.key}) = ${hasValue ? '✅' : '❌'}`, {
      value,
      points: hasValue ? field.points : 0
    })
  })

  const percentage = Math.round((earnedPoints / totalPoints) * 100)
  const completedFields = fields.length - missingFields.length
  const totalFields = fields.length

  console.log(`📊 Profile Completion Summary:`, {
    percentage: `${percentage}%`,
    completedFields: `${completedFields}/${totalFields}`,
    earnedPoints: `${earnedPoints}/${totalPoints}`,
    missingFields
  })

  // Encouraging messages based on completion
  let encouragingMessage = ''
  let nextStep = ''

  if (percentage === 0) {
    encouragingMessage = "Let's get started! Your dream job is waiting!"
    nextStep = "Add your phone number to begin"
  } else if (percentage < 25) {
    encouragingMessage = `Great start! You're ${100 - percentage}% away from standing out to employers!`
    nextStep = "Add a profile photo to make a great first impression"
  } else if (percentage < 50) {
    encouragingMessage = `Awesome progress! You're ${100 - percentage}% away from unlocking top job matches!`
    nextStep = "Tell employers about your dream position"
  } else if (percentage < 75) {
    encouragingMessage = `You're crushing it! Just ${100 - percentage}% more to maximize your chances!`
    nextStep = "Add your work preferences to get better matches"
  } else if (percentage < 100) {
    encouragingMessage = `Almost there! You're ${100 - percentage}% away from a complete profile!`
    nextStep = "Complete the final details to stand out"
  } else {
    encouragingMessage = "🎉 Perfect! Your profile is complete and ready to attract top employers!"
    nextStep = "Start applying to jobs"
  }

  return {
    percentage,
    completedFields,
    totalFields,
    missingFields,
    encouragingMessage,
    nextStep
  }
}

/**
 * Get profile completion status color
 */
export function getCompletionColor(percentage: number): {
  text: string
  bg: string
  border: string
  glow: string
} {
  if (percentage < 25) {
    return {
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      glow: 'shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]'
    }
  } else if (percentage < 50) {
    return {
      text: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      glow: 'shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)]'
    }
  } else if (percentage < 75) {
    return {
      text: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      glow: 'shadow-[0_0_20px_-5px_rgba(234,179,8,0.3)]'
    }
  } else if (percentage < 100) {
    return {
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      glow: 'shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)]'
    }
  } else {
    return {
      text: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      glow: 'shadow-[0_0_20px_-5px_rgba(34,197,94,0.3)]'
    }
  }
}
