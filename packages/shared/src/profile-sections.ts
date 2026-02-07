/**
 * Profile section definitions and completion tracking
 * Used for Facebook-style sectioned auto-save
 */

export interface SectionField {
  key: string
  label: string
  required: boolean
  section: ProfileSection
}

export type ProfileSection = 'basic' | 'location' | 'work' | 'social'

export interface SectionInfo {
  id: ProfileSection
  title: string
  description: string
  fields: SectionField[]
}

export const PROFILE_SECTIONS: Record<ProfileSection, SectionInfo> = {
  basic: {
    id: 'basic',
    title: 'Basic Information',
    description: 'Your core profile details',
    fields: [
      { key: 'username', label: 'Username', required: true, section: 'basic' },
      { key: 'headline', label: 'Professional Headline', required: false, section: 'basic' },
      { key: 'phone', label: 'Phone Number', required: true, section: 'basic' },
      { key: 'birthday', label: 'Birthday', required: true, section: 'basic' },
      { key: 'gender', label: 'Gender', required: true, section: 'basic' },
      { key: 'bio', label: 'Bio', required: false, section: 'basic' },
      { key: 'position', label: 'Desired Position', required: true, section: 'basic' },
    ],
  },
  location: {
    id: 'location',
    title: 'Location Information',
    description: 'Where you are based',
    fields: [
      { key: 'location', label: 'Location', required: true, section: 'location' },
      { key: 'location_city', label: 'City', required: false, section: 'location' },
      { key: 'location_province', label: 'Province', required: false, section: 'location' },
      { key: 'location_region', label: 'Region', required: false, section: 'location' },
    ],
  },
  work: {
    id: 'work',
    title: 'Work Preferences',
    description: 'Your career preferences',
    fields: [
      { key: 'work_status', label: 'Work Status', required: true, section: 'work' },
      { key: 'preferred_shift', label: 'Preferred Shift', required: true, section: 'work' },
      { key: 'preferred_work_setup', label: 'Work Setup', required: true, section: 'work' },
      { key: 'expected_salary_min', label: 'Min Salary', required: true, section: 'work' },
      { key: 'expected_salary_max', label: 'Max Salary', required: true, section: 'work' },
    ],
  },
  social: {
    id: 'social',
    title: 'Social Links',
    description: 'Your online presence (optional)',
    fields: [
      { key: 'website', label: 'Website', required: false, section: 'social' },
      { key: 'linkedin', label: 'LinkedIn', required: false, section: 'social' },
      { key: 'github', label: 'GitHub', required: false, section: 'social' },
      { key: 'twitter', label: 'Twitter', required: false, section: 'social' },
      { key: 'portfolio', label: 'Portfolio', required: false, section: 'social' },
    ],
  },
}

/**
 * Calculate section completion percentage
 */
export function calculateSectionCompletion(
  section: ProfileSection,
  formData: Record<string, any>
): { percentage: number; completed: number; total: number; missing: string[] } {
  const sectionInfo = PROFILE_SECTIONS[section]
  const requiredFields = sectionInfo.fields.filter(f => f.required)
  const allFields = sectionInfo.fields

  let completedRequired = 0
  let completedAll = 0
  const missing: string[] = []

  requiredFields.forEach(field => {
    const value = formData[field.key]
    const hasValue = value && String(value).trim() !== ''
    if (hasValue) {
      completedRequired++
    } else {
      missing.push(field.label)
    }
  })

  allFields.forEach(field => {
    const value = formData[field.key]
    const hasValue = value && String(value).trim() !== ''
    if (hasValue) {
      completedAll++
    }
  })

  const percentage = requiredFields.length > 0
    ? Math.round((completedRequired / requiredFields.length) * 100)
    : 100

  return {
    percentage,
    completed: completedAll,
    total: allFields.length,
    missing,
  }
}

/**
 * Get color scheme for section completion
 */
export function getSectionCompletionColor(percentage: number) {
  if (percentage === 100) {
    return {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      icon: 'text-green-400',
    }
  } else if (percentage >= 50) {
    return {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      icon: 'text-yellow-400',
    }
  } else {
    return {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: 'text-red-400',
    }
  }
}
