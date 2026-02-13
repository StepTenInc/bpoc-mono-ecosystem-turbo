import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════════
// RESUME DATA SCHEMA - Source of truth for all resume data
// Built for robustness - everything is validated
// ═══════════════════════════════════════════════════════════════════════════════

export const ExperienceSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  achievements: z.array(z.string()).default([]),
  description: z.string().optional(),
});

export const EducationSchema = z.object({
  id: z.string(),
  degree: z.string().min(1, 'Degree is required'),
  institution: z.string().min(1, 'Institution is required'),
  location: z.string().optional(),
  startYear: z.string().optional(),
  endYear: z.string().optional(),
  gpa: z.string().optional(),
  honors: z.string().optional(),
  description: z.string().optional(),
});

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  category: z.enum(['technical', 'soft', 'language', 'certification']).default('technical'),
});

export const ContactSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  github: z.string().optional(),
});

export const ResumeDataSchema = z.object({
  // Identity
  id: z.string().optional(),
  slug: z.string().optional(),
  
  // Basic info
  name: z.string().default(''),
  title: z.string().default(''), // Professional headline
  photo: z.string().optional(),
  
  // Contact
  contact: ContactSchema.default({}),
  
  // Summary
  summary: z.string().default(''),
  
  // Sections (ordered arrays)
  experience: z.array(ExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  skills: z.array(SkillSchema).default([]),
  
  // Section order (for drag & drop)
  sectionOrder: z.array(z.string()).default(['summary', 'experience', 'education', 'skills']),
  
  // Customization
  templateId: z.string().default('modern'),
  primaryColor: z.string().default('#0ea5e9'),
  secondaryColor: z.string().default('#7c3aed'),
  fontFamily: z.string().default('Inter'),
  
  // Metadata
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  version: z.number().optional().default(1),
});

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type ResumeData = z.infer<typeof ResumeDataSchema>;

// ═══════════════════════════════════════════════════════════════════════════════
// AI CONTEXT - Data from resume analysis to power smart suggestions
// ═══════════════════════════════════════════════════════════════════════════════

export interface AIAnalysisContext {
  // From initial upload/analysis
  extractedSkills: string[];
  suggestedSkills: string[];
  targetRole: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  industryKeywords: string[];
  
  // Scores
  overallScore: number;
  atsScore: number;
  contentScore: number;
  
  // Improvements
  improvements: Array<{
    section: string;
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  
  // Missing elements
  missingFields: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export function createId(): string {
  return crypto.randomUUID();
}

export function createExperience(data?: Partial<Experience>): Experience {
  return {
    id: createId(),
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    achievements: [],
    ...data,
  };
}

export function createEducation(data?: Partial<Education>): Education {
  return {
    id: createId(),
    degree: '',
    institution: '',
    location: '',
    startYear: '',
    endYear: '',
    ...data,
  };
}

export function createSkill(data?: Partial<Skill>): Skill {
  return {
    id: createId(),
    name: '',
    category: 'technical',
    ...data,
  };
}

export function createEmptyResume(): ResumeData {
  return ResumeDataSchema.parse({});
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

export function validateResume(data: unknown): { success: boolean; data?: ResumeData; errors?: z.ZodError } {
  const result = ResumeDataSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export function calculateCompletion(resume: ResumeData): number {
  let score = 0;
  const weights = {
    name: 10,
    title: 10,
    photo: 5,
    contact: 15,
    summary: 15,
    experience: 25,
    education: 10,
    skills: 10,
  };
  
  if (resume.name) score += weights.name;
  if (resume.title) score += weights.title;
  if (resume.photo) score += weights.photo;
  if (resume.contact.email || resume.contact.phone) score += weights.contact;
  if (resume.summary && resume.summary.length > 50) score += weights.summary;
  if (resume.experience.length > 0) score += weights.experience;
  if (resume.education.length > 0) score += weights.education;
  if (resume.skills.length > 0) score += weights.skills;
  
  return Math.min(100, score);
}
