/**
 * SCHEMA.ORG CONSTANTS
 * Shared structured data constants for JSON-LD schema generation
 * Used by pipeline Stage 7 and article render pages
 */

// ============================================
// AUTHOR: Ate Yna (primary content author)
// ============================================
export const ATE_YNA_AUTHOR = {
  '@type': 'Person' as const,
  name: 'Ate Yna',
  jobTitle: 'BPO Career Advisor',
  description:
    'Ate Yna is a BPO career advisor helping Filipino professionals navigate their careers in the outsourcing industry.',
  url: 'https://www.bpoc.io/author/ate-yna',
};

// ============================================
// PUBLISHER: BPOC Organization
// ============================================
export const BPOC_PUBLISHER = {
  '@type': 'Organization' as const,
  name: 'BPOC',
  url: 'https://www.bpoc.io',
  email: 'hello@bpoc.io',
  foundingDate: '2025',
  logo: {
    '@type': 'ImageObject' as const,
    url: 'https://www.bpoc.io/BPOC.IO-LOGO.svg',
  },
  address: {
    '@type': 'PostalAddress' as const,
    addressLocality: 'Clark Freeport Zone',
    addressRegion: 'Pampanga',
    addressCountry: 'PH',
  },
  areaServed: {
    '@type': 'Country' as const,
    name: 'Philippines',
  },
  sameAs: [
    'https://www.facebook.com/bpoc.io',
  ],
};

// ============================================
// SILO MAPPING: id → display name + slug
// ============================================
export interface SiloInfo {
  name: string;
  slug: string;
}

export const SILO_MAP: Record<string, SiloInfo> = {
  salary: {
    name: 'Salary & Compensation',
    slug: 'bpo-salary-compensation',
  },
  career: {
    name: 'Career Growth',
    slug: 'bpo-career-growth',
  },
  jobs: {
    name: 'BPO Jobs',
    slug: 'bpo-jobs',
  },
  interview: {
    name: 'Interview Tips',
    slug: 'interview-tips',
  },
  'employment-guide': {
    name: 'Employment Guide',
    slug: 'bpo-employment-guide',
  },
  benefits: {
    name: 'Employment Guide',
    slug: 'bpo-employment-guide',
  },
  companies: {
    name: 'Company Reviews',
    slug: 'bpo-company-reviews',
  },
  training: {
    name: 'Training',
    slug: 'training-and-certifications',
  },
  worklife: {
    name: 'Work-Life Balance',
    slug: 'work-life-balance',
  },
};

/**
 * Resolve silo info from silo id/key.
 * Falls back to a generic silo if not found.
 */
export function resolveSilo(siloId: string | undefined | null): SiloInfo | null {
  if (!siloId) return null;
  return SILO_MAP[siloId] || null;
}

// Base URL for canonical links (www version — matches domain config)
export const BASE_URL = 'https://www.bpoc.io';
