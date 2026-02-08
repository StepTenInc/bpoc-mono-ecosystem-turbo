/**
 * Shared types for the AI Content Pipeline
 */

// Pipeline State - shared across all stages
export interface PipelineState {
  // Stage 1 - Brief
  transcript: string;
  briefConfirmed: boolean;
  selectedSilo: string;
  selectedSiloId: string | null; // UUID of the selected silo
  customTopic: string;
  selectedIdea: any;
  isSiloPage: boolean; // Whether this article IS a silo page (pillar)
  isPillar: boolean; // Alias for isSiloPage (used by some API routes)

  // Stage 2 - Research
  researchData: any;

  // Stage 3 - Plan
  plan: any;
  planApproved: boolean;

  // Stage 4 - Write
  article: string;
  wordCount: number;

  // Stage 5 - Humanize
  humanizedArticle: string;
  humanScore: number;
  humanizeChanges: any;

  // Stage 6 - SEO
  seoArticle: string;
  seoStats: any;
  seoChanges: any;
  seoSummary: string;

  // Stage 7 - Meta
  meta: any;
  images: any[];
  imagePrompts: any[];
  metaSummary: any;
  heroType: 'image' | 'video' | null;
  videoUrl: string | null;

  // Content sections (split for images)
  contentSections: string[];

  // Draft & Pipeline IDs
  draftId: string | null;
  insightId: string | null;
  pipelineId: string | null;

  // Editor compatibility fields (optional styling)
  iconName?: string;
  color?: string;
  bgColor?: string;
  readTime?: string;
  appliedLinks?: Array<{ url: string; text: string; position: number }>;
}

export const initialPipelineState: PipelineState = {
  transcript: '',
  briefConfirmed: false,
  selectedSilo: '',
  selectedSiloId: null,
  customTopic: '',
  selectedIdea: null,
  isSiloPage: false,
  isPillar: false,
  researchData: null,
  plan: null,
  planApproved: false,
  article: '',
  wordCount: 0,
  humanizedArticle: '',
  humanScore: 0,
  humanizeChanges: null,
  seoArticle: '',
  seoStats: null,
  seoChanges: null,
  seoSummary: '',
  meta: null,
  images: [],
  imagePrompts: [],
  metaSummary: null,
  heroType: null,
  videoUrl: null,
  contentSections: [],
  draftId: null,
  insightId: null,
  pipelineId: null,
  // Editor compatibility defaults
  iconName: 'FileText',
  color: 'text-cyan-400',
  bgColor: 'bg-cyan-500/10',
  readTime: '',
  appliedLinks: [],
};

// BPO Content Silos
export const BPO_SILOS = [
  { id: 'salary', name: 'Salary & Compensation', description: 'BPO salary guides, pay scales' },
  { id: 'career', name: 'Career Growth', description: 'Promotions, leadership' },
  { id: 'jobs', name: 'BPO Jobs', description: 'Job openings, hiring' },
  { id: 'interview', name: 'Interview Tips', description: 'Interview prep, Versant' },
  { id: 'employment-guide', name: 'Employment Guide', description: 'DOLE laws, rights' },
  { id: 'companies', name: 'Company Reviews', description: 'BPO reviews, culture' },
  { id: 'training', name: 'Training', description: 'Training, certifications' },
  { id: 'worklife', name: 'Work-Life Balance', description: 'Stress, schedules' },
];

// Stage information
export const STAGES = [
  { num: 1, label: 'Brief' },
  { num: 2, label: 'Research' },
  { num: 3, label: 'Plan' },
  { num: 4, label: 'Write' },
  { num: 5, label: 'Humanize' },
  { num: 6, label: 'SEO' },
  { num: 7, label: 'Meta' },
  { num: 8, label: 'Media' },
  { num: 9, label: 'Publish' },
];

// Common props for stage components
export interface StageProps {
  state: PipelineState;
  updateState: (updates: Partial<PipelineState>) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
  savePipelineProgress: (pipelineId: string, stageNum: number, data: Record<string, any>, aiLog?: any) => Promise<boolean>;
  saveProgress: (insightId: string, updates: Record<string, any>, pipelineStage: string) => Promise<any>;
}

// Helper function to split content into 3 sections based on H2 headings
export const splitContentIntoSections = (content: string): string[] => {
  if (!content) return ['', '', ''];

  // Split by H2 headings (## )
  const h2Sections = content.split(/(?=^##\s)/m).filter(s => s.trim());

  if (h2Sections.length >= 3) {
    // Group into 3 parts
    const sectionsPerPart = Math.ceil(h2Sections.length / 3);
    return [
      h2Sections.slice(0, sectionsPerPart).join('\n\n'),
      h2Sections.slice(sectionsPerPart, sectionsPerPart * 2).join('\n\n'),
      h2Sections.slice(sectionsPerPart * 2).join('\n\n'),
    ];
  } else {
    // Fallback: split by paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    const third = Math.ceil(paragraphs.length / 3);
    return [
      paragraphs.slice(0, third).join('\n\n'),
      paragraphs.slice(third, third * 2).join('\n\n'),
      paragraphs.slice(third * 2).join('\n\n'),
    ];
  }
};
