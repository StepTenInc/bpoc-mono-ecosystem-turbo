import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// RESUME DATA SCHEMA - Source of truth for all resume data
// ═══════════════════════════════════════════════════════════════

export const ContactSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
});

export const ExperienceSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(), // Empty = "Present"
  current: z.boolean().default(false),
  achievements: z.array(z.string()),
});

export const EducationSchema = z.object({
  id: z.string(),
  degree: z.string(),
  institution: z.string(),
  location: z.string().optional(),
  year: z.string(),
  gpa: z.string().optional(),
  honors: z.string().optional(),
});

export const SkillsSchema = z.object({
  technical: z.array(z.string()),
  soft: z.array(z.string()),
  languages: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
});

export const ResumeDataSchema = z.object({
  // Basic info
  name: z.string(),
  title: z.string(), // Job title / headline
  photo: z.string().optional(), // URL or data URL
  
  // Contact
  contact: ContactSchema,
  
  // Summary
  summary: z.string().optional(),
  
  // Sections
  experience: z.array(ExperienceSchema),
  education: z.array(EducationSchema),
  skills: SkillsSchema,
  
  // Customization
  templateId: z.enum(['modern', 'executive', 'creative', 'minimal']).default('modern'),
  primaryColor: z.string().default('#0ea5e9'),
  secondaryColor: z.string().default('#7c3aed'),
  
  // Metadata
  lastUpdated: z.string().optional(),
  slug: z.string().optional(),
});

export type Contact = z.infer<typeof ContactSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Skills = z.infer<typeof SkillsSchema>;
export type ResumeData = z.infer<typeof ResumeDataSchema>;

// ═══════════════════════════════════════════════════════════════
// TEMPLATE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export type TemplateId = 'modern' | 'executive' | 'creative' | 'minimal';

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  features: string[];
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: '2-column layout with colored sidebar',
    icon: 'LayoutPanelLeft',
    features: ['Photo in sidebar', 'Skills visualization', 'Clean sections'],
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Traditional professional layout',
    icon: 'FileText',
    features: ['Serif typography', 'Centered header', 'Classic formatting'],
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold hero section with visual cards',
    icon: 'Palette',
    features: ['Large header photo', 'Card-based sections', 'Gradient accents'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Typography-focused, no photo',
    icon: 'Type',
    features: ['Clean typography', 'No distractions', 'Content first'],
  },
];

// ═══════════════════════════════════════════════════════════════
// COLOR SCHEMES
// ═══════════════════════════════════════════════════════════════

export interface ColorScheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  icon: string;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  { id: 'ocean', name: 'Ocean', primary: '#0ea5e9', secondary: '#7c3aed', icon: '🌊' },
  { id: 'sunset', name: 'Sunset', primary: '#f97316', secondary: '#ec4899', icon: '🌅' },
  { id: 'forest', name: 'Forest', primary: '#10b981', secondary: '#059669', icon: '🌲' },
  { id: 'royal', name: 'Royal', primary: '#1e3a8a', secondary: '#7c3aed', icon: '👑' },
  { id: 'fire', name: 'Fire', primary: '#ef4444', secondary: '#f97316', icon: '🔥' },
  { id: 'berry', name: 'Berry', primary: '#d946ef', secondary: '#ec4899', icon: '🍇' },
  { id: 'slate', name: 'Slate', primary: '#475569', secondary: '#64748b', icon: '🪨' },
];

// ═══════════════════════════════════════════════════════════════
// EMPTY/DEFAULT DATA
// ═══════════════════════════════════════════════════════════════

export const EMPTY_RESUME: ResumeData = {
  name: '',
  title: '',
  photo: undefined,
  contact: {
    email: '',
    phone: '',
    location: '',
  },
  summary: '',
  experience: [],
  education: [],
  skills: {
    technical: [],
    soft: [],
  },
  templateId: 'modern',
  primaryColor: '#0ea5e9',
  secondaryColor: '#7c3aed',
};

export function createEmptyExperience(): Experience {
  return {
    id: crypto.randomUUID(),
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    achievements: [],
  };
}

export function createEmptyEducation(): Education {
  return {
    id: crypto.randomUUID(),
    degree: '',
    institution: '',
    location: '',
    year: '',
  };
}
