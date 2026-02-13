import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  ResumeData, 
  Experience, 
  Education, 
  TemplateId, 
  EMPTY_RESUME,
  createEmptyExperience,
  createEmptyEducation,
} from '../lib/schema';

// ═══════════════════════════════════════════════════════════════
// RESUME STORE - Global state for resume builder
// ═══════════════════════════════════════════════════════════════

interface ResumeStore {
  // Data
  resume: ResumeData;
  isDirty: boolean;
  lastSaved: Date | null;
  
  // UI State
  activeSection: string | null;
  previewZoom: number;
  showAIPanel: boolean;
  
  // Actions - Basic
  setResume: (data: Partial<ResumeData>) => void;
  resetResume: () => void;
  loadResume: (data: ResumeData) => void;
  
  // Actions - Name & Contact
  setName: (name: string) => void;
  setTitle: (title: string) => void;
  setPhoto: (photo: string | undefined) => void;
  setContact: (field: keyof ResumeData['contact'], value: string) => void;
  setSummary: (summary: string) => void;
  
  // Actions - Experience
  addExperience: (exp?: Partial<Experience>) => void;
  updateExperience: (id: string, data: Partial<Experience>) => void;
  removeExperience: (id: string) => void;
  reorderExperience: (fromIndex: number, toIndex: number) => void;
  
  // Actions - Education
  addEducation: (edu?: Partial<Education>) => void;
  updateEducation: (id: string, data: Partial<Education>) => void;
  removeEducation: (id: string) => void;
  
  // Actions - Skills
  addSkill: (type: 'technical' | 'soft', skill: string) => void;
  removeSkill: (type: 'technical' | 'soft', skill: string) => void;
  setSkills: (type: 'technical' | 'soft', skills: string[]) => void;
  
  // Actions - Customization
  setTemplate: (templateId: TemplateId) => void;
  setColors: (primary: string, secondary?: string) => void;
  
  // Actions - UI
  setActiveSection: (section: string | null) => void;
  setPreviewZoom: (zoom: number) => void;
  toggleAIPanel: () => void;
  
  // Actions - Persistence
  markClean: () => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      resume: EMPTY_RESUME,
      isDirty: false,
      lastSaved: null,
      activeSection: null,
      previewZoom: 1.0,
      showAIPanel: false,
      
      // Basic actions
      setResume: (data) => set((state) => ({
        resume: { ...state.resume, ...data },
        isDirty: true,
      })),
      
      resetResume: () => set({
        resume: EMPTY_RESUME,
        isDirty: false,
      }),
      
      loadResume: (data) => set({
        resume: data,
        isDirty: false,
      }),
      
      // Name & Contact
      setName: (name) => set((state) => ({
        resume: { ...state.resume, name },
        isDirty: true,
      })),
      
      setTitle: (title) => set((state) => ({
        resume: { ...state.resume, title },
        isDirty: true,
      })),
      
      setPhoto: (photo) => set((state) => ({
        resume: { ...state.resume, photo },
        isDirty: true,
      })),
      
      setContact: (field, value) => set((state) => ({
        resume: {
          ...state.resume,
          contact: { ...state.resume.contact, [field]: value },
        },
        isDirty: true,
      })),
      
      setSummary: (summary) => set((state) => ({
        resume: { ...state.resume, summary },
        isDirty: true,
      })),
      
      // Experience
      addExperience: (exp) => set((state) => ({
        resume: {
          ...state.resume,
          experience: [
            ...state.resume.experience,
            { ...createEmptyExperience(), ...exp },
          ],
        },
        isDirty: true,
      })),
      
      updateExperience: (id, data) => set((state) => ({
        resume: {
          ...state.resume,
          experience: state.resume.experience.map((exp) =>
            exp.id === id ? { ...exp, ...data } : exp
          ),
        },
        isDirty: true,
      })),
      
      removeExperience: (id) => set((state) => ({
        resume: {
          ...state.resume,
          experience: state.resume.experience.filter((exp) => exp.id !== id),
        },
        isDirty: true,
      })),
      
      reorderExperience: (fromIndex, toIndex) => set((state) => {
        const experience = [...state.resume.experience];
        const [removed] = experience.splice(fromIndex, 1);
        experience.splice(toIndex, 0, removed);
        return {
          resume: { ...state.resume, experience },
          isDirty: true,
        };
      }),
      
      // Education
      addEducation: (edu) => set((state) => ({
        resume: {
          ...state.resume,
          education: [
            ...state.resume.education,
            { ...createEmptyEducation(), ...edu },
          ],
        },
        isDirty: true,
      })),
      
      updateEducation: (id, data) => set((state) => ({
        resume: {
          ...state.resume,
          education: state.resume.education.map((edu) =>
            edu.id === id ? { ...edu, ...data } : edu
          ),
        },
        isDirty: true,
      })),
      
      removeEducation: (id) => set((state) => ({
        resume: {
          ...state.resume,
          education: state.resume.education.filter((edu) => edu.id !== id),
        },
        isDirty: true,
      })),
      
      // Skills
      addSkill: (type, skill) => set((state) => {
        const currentSkills = state.resume.skills[type] || [];
        if (currentSkills.includes(skill)) return state;
        return {
          resume: {
            ...state.resume,
            skills: {
              ...state.resume.skills,
              [type]: [...currentSkills, skill],
            },
          },
          isDirty: true,
        };
      }),
      
      removeSkill: (type, skill) => set((state) => ({
        resume: {
          ...state.resume,
          skills: {
            ...state.resume.skills,
            [type]: state.resume.skills[type].filter((s) => s !== skill),
          },
        },
        isDirty: true,
      })),
      
      setSkills: (type, skills) => set((state) => ({
        resume: {
          ...state.resume,
          skills: {
            ...state.resume.skills,
            [type]: skills,
          },
        },
        isDirty: true,
      })),
      
      // Customization
      setTemplate: (templateId) => set((state) => ({
        resume: { ...state.resume, templateId },
        isDirty: true,
      })),
      
      setColors: (primary, secondary) => set((state) => ({
        resume: {
          ...state.resume,
          primaryColor: primary,
          ...(secondary && { secondaryColor: secondary }),
        },
        isDirty: true,
      })),
      
      // UI
      setActiveSection: (section) => set({ activeSection: section }),
      setPreviewZoom: (zoom) => set({ previewZoom: Math.max(0.5, Math.min(1.5, zoom)) }),
      toggleAIPanel: () => set((state) => ({ showAIPanel: !state.showAIPanel })),
      
      // Persistence
      markClean: () => set({ isDirty: false, lastSaved: new Date() }),
    }),
    {
      name: 'bpoc-resume-builder',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        resume: state.resume,
        previewZoom: state.previewZoom,
      }),
    }
  )
);

// Selector hooks for performance
export const useResumeData = () => useResumeStore((s) => s.resume);
export const useResumeTemplate = () => useResumeStore((s) => s.resume.templateId);
export const useResumeColors = () => useResumeStore((s) => ({
  primary: s.resume.primaryColor,
  secondary: s.resume.secondaryColor,
}));
export const useResumeExperience = () => useResumeStore((s) => s.resume.experience);
export const useResumeEducation = () => useResumeStore((s) => s.resume.education);
export const useResumeSkills = () => useResumeStore((s) => s.resume.skills);
