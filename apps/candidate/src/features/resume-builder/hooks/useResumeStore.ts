import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  ResumeData, 
  Experience, 
  Education, 
  Skill,
  AIAnalysisContext,
  createEmptyResume,
  createExperience,
  createEducation,
  createSkill,
  calculateCompletion,
} from '../lib/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// RESUME STORE - Central state management for the resume builder
// Uses Zustand with immer for immutable updates and persist for localStorage
// ═══════════════════════════════════════════════════════════════════════════════

interface ResumeState {
  // Resume data
  resume: ResumeData;
  
  // AI context from analysis
  aiContext: AIAnalysisContext | null;
  
  // UI state
  activeSection: string | null;
  editingItemId: string | null;
  previewZoom: number;
  showAIPanel: boolean;
  isSaving: boolean;
  isExporting: boolean;
  
  // Dirty tracking
  isDirty: boolean;
  lastSaved: Date | null;
  
  // Completion score (computed)
  completionScore: number;
}

interface ResumeActions {
  // Resume operations
  setResume: (data: Partial<ResumeData>) => void;
  loadResume: (data: ResumeData) => void;
  resetResume: () => void;
  
  // Basic fields
  setName: (name: string) => void;
  setTitle: (title: string) => void;
  setPhoto: (photo: string | undefined) => void;
  setSummary: (summary: string) => void;
  setContact: (field: keyof ResumeData['contact'], value: string) => void;
  
  // Experience
  addExperience: (data?: Partial<Experience>) => string;
  updateExperience: (id: string, data: Partial<Experience>) => void;
  removeExperience: (id: string) => void;
  reorderExperience: (fromIndex: number, toIndex: number) => void;
  
  // Education
  addEducation: (data?: Partial<Education>) => string;
  updateEducation: (id: string, data: Partial<Education>) => void;
  removeEducation: (id: string) => void;
  reorderEducation: (fromIndex: number, toIndex: number) => void;
  
  // Skills
  addSkill: (data?: Partial<Skill>) => string;
  updateSkill: (id: string, data: Partial<Skill>) => void;
  removeSkill: (id: string) => void;
  bulkAddSkills: (skills: string[], category?: Skill['category']) => void;
  
  // Section order
  reorderSections: (fromIndex: number, toIndex: number) => void;
  
  // Customization
  setTemplate: (templateId: string) => void;
  setColors: (primary: string, secondary?: string) => void;
  setFont: (fontFamily: string) => void;
  
  // AI Context
  setAIContext: (context: AIAnalysisContext) => void;
  clearAIContext: () => void;
  
  // UI state
  setActiveSection: (section: string | null) => void;
  setEditingItem: (itemId: string | null) => void;
  setPreviewZoom: (zoom: number) => void;
  toggleAIPanel: () => void;
  setSaving: (saving: boolean) => void;
  setExporting: (exporting: boolean) => void;
  
  // Dirty tracking
  markClean: () => void;
  markDirty: () => void;
}

type ResumeStore = ResumeState & ResumeActions;

// Helper to update completion score
const updateCompletion = (state: ResumeState) => {
  state.completionScore = calculateCompletion(state.resume);
};

export const useResumeStore = create<ResumeStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      resume: createEmptyResume(),
      aiContext: null,
      activeSection: null,
      editingItemId: null,
      previewZoom: 1.0,
      showAIPanel: false,
      isSaving: false,
      isExporting: false,
      isDirty: false,
      lastSaved: null,
      completionScore: 0,
      
      // Resume operations
      setResume: (data) => set((state) => {
        Object.assign(state.resume, data);
        state.isDirty = true;
        updateCompletion(state);
      }),
      
      loadResume: (data) => set((state) => {
        state.resume = data;
        state.isDirty = false;
        updateCompletion(state);
      }),
      
      resetResume: () => set((state) => {
        state.resume = createEmptyResume();
        state.isDirty = false;
        state.completionScore = 0;
      }),
      
      // Basic fields
      setName: (name) => set((state) => {
        state.resume.name = name;
        state.isDirty = true;
        updateCompletion(state);
      }),
      
      setTitle: (title) => set((state) => {
        state.resume.title = title;
        state.isDirty = true;
        updateCompletion(state);
      }),
      
      setPhoto: (photo) => set((state) => {
        state.resume.photo = photo;
        state.isDirty = true;
        updateCompletion(state);
      }),
      
      setSummary: (summary) => set((state) => {
        state.resume.summary = summary;
        state.isDirty = true;
        updateCompletion(state);
      }),
      
      setContact: (field, value) => set((state) => {
        state.resume.contact[field] = value;
        state.isDirty = true;
        updateCompletion(state);
      }),
      
      // Experience
      addExperience: (data) => {
        const exp = createExperience(data);
        set((state) => {
          state.resume.experience.push(exp);
          state.isDirty = true;
          updateCompletion(state);
        });
        return exp.id;
      },
      
      updateExperience: (id, data) => set((state) => {
        const index = state.resume.experience.findIndex(e => e.id === id);
        if (index !== -1) {
          Object.assign(state.resume.experience[index], data);
          state.isDirty = true;
        }
      }),
      
      removeExperience: (id) => set((state) => {
        state.resume.experience = state.resume.experience.filter(e => e.id !== id);
        state.isDirty = true;
        updateCompletion(state);
      }),
      
      reorderExperience: (fromIndex, toIndex) => set((state) => {
        const [removed] = state.resume.experience.splice(fromIndex, 1);
        state.resume.experience.splice(toIndex, 0, removed);
        state.isDirty = true;
      }),
      
      // Education
      addEducation: (data) => {
        const edu = createEducation(data);
        set((state) => {
          state.resume.education.push(edu);
          state.isDirty = true;
          updateCompletion(state);
        });
        return edu.id;
      },
      
      updateEducation: (id, data) => set((state) => {
        const index = state.resume.education.findIndex(e => e.id === id);
        if (index !== -1) {
          Object.assign(state.resume.education[index], data);
          state.isDirty = true;
        }
      }),
      
      removeEducation: (id) => set((state) => {
        state.resume.education = state.resume.education.filter(e => e.id !== id);
        state.isDirty = true;
        updateCompletion(state);
      }),
      
      reorderEducation: (fromIndex, toIndex) => set((state) => {
        const [removed] = state.resume.education.splice(fromIndex, 1);
        state.resume.education.splice(toIndex, 0, removed);
        state.isDirty = true;
      }),
      
      // Skills
      addSkill: (data) => {
        const skill = createSkill(data);
        set((state) => {
          state.resume.skills.push(skill);
          state.isDirty = true;
          updateCompletion(state);
        });
        return skill.id;
      },
      
      updateSkill: (id, data) => set((state) => {
        const index = state.resume.skills.findIndex(s => s.id === id);
        if (index !== -1) {
          Object.assign(state.resume.skills[index], data);
          state.isDirty = true;
        }
      }),
      
      removeSkill: (id) => set((state) => {
        state.resume.skills = state.resume.skills.filter(s => s.id !== id);
        state.isDirty = true;
        updateCompletion(state);
      }),
      
      bulkAddSkills: (skills, category = 'technical') => set((state) => {
        skills.forEach(name => {
          if (!state.resume.skills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
            state.resume.skills.push(createSkill({ name, category }));
          }
        });
        state.isDirty = true;
        updateCompletion(state);
      }),
      
      // Section order
      reorderSections: (fromIndex, toIndex) => set((state) => {
        const [removed] = state.resume.sectionOrder.splice(fromIndex, 1);
        state.resume.sectionOrder.splice(toIndex, 0, removed);
        state.isDirty = true;
      }),
      
      // Customization
      setTemplate: (templateId) => set((state) => {
        state.resume.templateId = templateId;
        state.isDirty = true;
      }),
      
      setColors: (primary, secondary) => set((state) => {
        state.resume.primaryColor = primary;
        if (secondary) state.resume.secondaryColor = secondary;
        state.isDirty = true;
      }),
      
      setFont: (fontFamily) => set((state) => {
        state.resume.fontFamily = fontFamily;
        state.isDirty = true;
      }),
      
      // AI Context
      setAIContext: (context) => set((state) => {
        state.aiContext = context;
      }),
      
      clearAIContext: () => set((state) => {
        state.aiContext = null;
      }),
      
      // UI state
      setActiveSection: (section) => set((state) => {
        state.activeSection = section;
      }),
      
      setEditingItem: (itemId) => set((state) => {
        state.editingItemId = itemId;
      }),
      
      setPreviewZoom: (zoom) => set((state) => {
        state.previewZoom = Math.max(0.5, Math.min(1.5, zoom));
      }),
      
      toggleAIPanel: () => set((state) => {
        state.showAIPanel = !state.showAIPanel;
      }),
      
      setSaving: (saving) => set((state) => {
        state.isSaving = saving;
      }),
      
      setExporting: (exporting) => set((state) => {
        state.isExporting = exporting;
      }),
      
      // Dirty tracking
      markClean: () => set((state) => {
        state.isDirty = false;
        state.lastSaved = new Date();
      }),
      
      markDirty: () => set((state) => {
        state.isDirty = true;
      }),
    })),
    {
      name: 'bpoc-resume-builder-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        resume: state.resume,
        aiContext: state.aiContext,
        previewZoom: state.previewZoom,
      }),
    }
  )
);

// ═══════════════════════════════════════════════════════════════════════════════
// SELECTOR HOOKS - For optimized re-renders
// ═══════════════════════════════════════════════════════════════════════════════

export const useResume = () => useResumeStore((s) => s.resume);
export const useResumeTemplate = () => useResumeStore((s) => s.resume.templateId);
export const useResumeColors = () => useResumeStore((s) => ({
  primary: s.resume.primaryColor,
  secondary: s.resume.secondaryColor,
}));
export const useResumeExperience = () => useResumeStore((s) => s.resume.experience);
export const useResumeEducation = () => useResumeStore((s) => s.resume.education);
export const useResumeSkills = () => useResumeStore((s) => s.resume.skills);
export const useAIContext = () => useResumeStore((s) => s.aiContext);
export const useCompletionScore = () => useResumeStore((s) => s.completionScore);
export const useIsDirty = () => useResumeStore((s) => s.isDirty);
