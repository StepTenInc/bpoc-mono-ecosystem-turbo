// ═══════════════════════════════════════════════════════════════════════════════
// RESUME BUILDER FEATURE - Public exports
// Import from '@/features/resume-builder' to use
// ═══════════════════════════════════════════════════════════════════════════════

// Main builder component
export { ResumeBuilder } from './components/ResumeBuilder';

// Templates
export { 
  ResumePreview,
  ModernTemplate,
  ExecutiveTemplate,
  CreativeTemplate,
  MinimalTemplate,
  getAvailableTemplates,
  isValidTemplate,
} from './components/templates';

// AI Assistant
export { AIAssistant } from './components/ai/AIAssistant';

// Edit Panel
export { EditPanel } from './components/builder/EditPanel';

// Store and hooks
export { 
  useResumeStore,
  useResume,
  useResumeTemplate,
  useResumeColors,
  useResumeExperience,
  useResumeEducation,
  useResumeSkills,
  useAIContext,
  useCompletionScore,
  useIsDirty,
} from './hooks/useResumeStore';

// Schema and types
export {
  ResumeDataSchema,
  ExperienceSchema,
  EducationSchema,
  SkillSchema,
  ContactSchema,
  createId,
  createExperience,
  createEducation,
  createSkill,
  createEmptyResume,
  validateResume,
  calculateCompletion,
} from './lib/schema';

export type {
  ResumeData,
  Experience,
  Education,
  Skill,
  Contact,
  AIAnalysisContext,
} from './lib/schema';

// Template utilities
export {
  TEMPLATES,
  COLOR_SCHEMES,
  FONTS,
  getTemplate,
  getColorScheme,
  getFont,
  getTemplatesByCategory,
  generateGradient,
  getContrastColor,
} from './lib/templates';

export type {
  TemplateMetadata,
  TemplateProps,
  ColorScheme,
  FontOption,
} from './lib/templates';
