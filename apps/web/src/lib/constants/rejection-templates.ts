/**
 * Predefined rejection reason templates for application rejections
 * Provides consistency and saves time for recruiters
 */

export interface RejectionTemplate {
  id: string;
  label: string;
  message: string;
  category: 'skills' | 'experience' | 'cultural' | 'logistics' | 'other';
}

export const REJECTION_TEMPLATES: RejectionTemplate[] = [
  // Skills-related
  {
    id: 'skills_mismatch',
    label: 'Skills Mismatch',
    message: 'After careful review, we found that your skills and experience do not closely match the requirements for this position.',
    category: 'skills',
  },
  {
    id: 'insufficient_technical',
    label: 'Insufficient Technical Skills',
    message: 'We require specific technical competencies for this role that were not demonstrated in your application or interview.',
    category: 'skills',
  },
  {
    id: 'language_proficiency',
    label: 'Language Proficiency',
    message: 'This role requires a higher level of English proficiency than what was demonstrated during the screening process.',
    category: 'skills',
  },
  
  // Experience-related
  {
    id: 'insufficient_experience',
    label: 'Insufficient Experience',
    message: 'We are looking for candidates with more years of relevant experience for this position.',
    category: 'experience',
  },
  {
    id: 'overqualified',
    label: 'Overqualified',
    message: 'Your extensive experience and qualifications exceed the requirements for this role, and we believe you would be better suited for a more senior position.',
    category: 'experience',
  },
  {
    id: 'industry_experience',
    label: 'Industry Experience Required',
    message: 'This position requires specific industry experience that was not present in your background.',
    category: 'experience',
  },

  // Cultural fit
  {
    id: 'cultural_fit',
    label: 'Cultural Fit Concerns',
    message: 'While your qualifications are impressive, we felt that there may be better alignment between your work style and another opportunity.',
    category: 'cultural',
  },
  {
    id: 'team_dynamics',
    label: 'Team Dynamics',
    message: 'After careful consideration, we have decided to move forward with candidates whose work style more closely aligns with our team structure.',
    category: 'cultural',
  },

  // Logistics
  {
    id: 'salary_expectations',
    label: 'Salary Expectations Too High',
    message: 'Your salary expectations exceed the budget allocated for this position, and we are unable to meet your requirements at this time.',
    category: 'logistics',
  },
  {
    id: 'availability',
    label: 'Availability Mismatch',
    message: 'Your availability does not align with the start date or schedule requirements for this position.',
    category: 'logistics',
  },
  {
    id: 'location_shift',
    label: 'Location/Shift Requirements',
    message: 'This role requires specific location or shift arrangements that do not match your preferences or availability.',
    category: 'logistics',
  },
  {
    id: 'notice_period',
    label: 'Notice Period Too Long',
    message: 'The client needs someone to start sooner than your current notice period allows.',
    category: 'logistics',
  },

  // Other
  {
    id: 'internal_candidate',
    label: 'Internal Candidate Selected',
    message: 'We have decided to move forward with an internal candidate for this position.',
    category: 'other',
  },
  {
    id: 'position_filled',
    label: 'Position Filled',
    message: 'This position has been filled. We will keep your profile on file for future opportunities.',
    category: 'other',
  },
  {
    id: 'hiring_freeze',
    label: 'Hiring Freeze',
    message: 'Due to unforeseen circumstances, the client has temporarily suspended hiring for this position.',
    category: 'other',
  },
  {
    id: 'qualification_verification',
    label: 'Unable to Verify Qualifications',
    message: 'We were unable to verify certain qualifications or credentials listed in your application.',
    category: 'other',
  },
  {
    id: 'background_check',
    label: 'Background Check Concerns',
    message: 'Issues arose during the background verification process that prevent us from moving forward with your application.',
    category: 'other',
  },
  {
    id: 'assessment_results',
    label: 'Assessment Results',
    message: 'Your assessment results did not meet the minimum requirements set by the client for this role.',
    category: 'other',
  },
  {
    id: 'better_candidates',
    label: 'Other Candidates Selected',
    message: 'After careful consideration, we have decided to move forward with candidates whose qualifications more closely match our current needs.',
    category: 'other',
  },
];

/**
 * Get rejection templates by category
 */
export function getTemplatesByCategory(category: RejectionTemplate['category']): RejectionTemplate[] {
  return REJECTION_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get rejection template by ID
 */
export function getTemplateById(id: string): RejectionTemplate | undefined {
  return REJECTION_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all rejection categories
 */
export function getRejectionCategories(): Array<{ value: RejectionTemplate['category']; label: string }> {
  return [
    { value: 'skills', label: 'Skills & Qualifications' },
    { value: 'experience', label: 'Experience Level' },
    { value: 'cultural', label: 'Cultural Fit' },
    { value: 'logistics', label: 'Logistics & Availability' },
    { value: 'other', label: 'Other Reasons' },
  ];
}
