// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE REGISTRY - Expandable template system
// To add a new template:
// 1. Create the component in /components/templates/YourTemplate.tsx
// 2. Add it to TEMPLATE_COMPONENTS below
// 3. Add metadata to TEMPLATES array
// That's it! The system handles everything else.
// ═══════════════════════════════════════════════════════════════════════════════

import { ComponentType } from 'react';
import { ResumeData } from './schema';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE METADATA
// ═══════════════════════════════════════════════════════════════════════════════

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'minimal' | 'modern';
  features: string[];
  thumbnail?: string;
  premium?: boolean;
}

export const TEMPLATES: TemplateMetadata[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: '2-column layout with colored sidebar',
    category: 'modern',
    features: ['Photo in sidebar', 'Skills visualization', 'Clean sections', 'ATS-friendly'],
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Traditional professional layout',
    category: 'professional',
    features: ['Serif typography', 'Centered header', 'Classic formatting', 'Print-optimized'],
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold hero section with visual cards',
    category: 'creative',
    features: ['Large header photo', 'Card-based sections', 'Gradient accents', 'Modern design'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Typography-focused, no distractions',
    category: 'minimal',
    features: ['Clean typography', 'No photo', 'Content first', 'Maximum readability'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR SCHEMES
// ═══════════════════════════════════════════════════════════════════════════════

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
  { id: 'midnight', name: 'Midnight', primary: '#1e293b', secondary: '#334155', icon: '🌙' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// FONT OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface FontOption {
  id: string;
  name: string;
  family: string;
  category: 'sans' | 'serif' | 'mono';
}

export const FONTS: FontOption[] = [
  { id: 'inter', name: 'Inter', family: 'Inter, sans-serif', category: 'sans' },
  { id: 'roboto', name: 'Roboto', family: 'Roboto, sans-serif', category: 'sans' },
  { id: 'poppins', name: 'Poppins', family: 'Poppins, sans-serif', category: 'sans' },
  { id: 'playfair', name: 'Playfair Display', family: '"Playfair Display", serif', category: 'serif' },
  { id: 'merriweather', name: 'Merriweather', family: 'Merriweather, serif', category: 'serif' },
  { id: 'source-code', name: 'Source Code Pro', family: '"Source Code Pro", monospace', category: 'mono' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════════════════

export interface TemplateProps {
  data: ResumeData;
  primaryColor: string;
  secondaryColor: string;
  editable?: boolean;
  onEditSection?: (section: string, itemId?: string) => void;
  onPhotoUpload?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export function getTemplate(id: string): TemplateMetadata | undefined {
  return TEMPLATES.find(t => t.id === id);
}

export function getColorScheme(id: string): ColorScheme | undefined {
  return COLOR_SCHEMES.find(c => c.id === id);
}

export function getFont(id: string): FontOption | undefined {
  return FONTS.find(f => f.id === id);
}

export function getTemplatesByCategory(category: TemplateMetadata['category']): TemplateMetadata[] {
  return TEMPLATES.filter(t => t.category === category);
}

// Generate gradient from colors
export function generateGradient(primary: string, secondary: string, angle: number = 135): string {
  return `linear-gradient(${angle}deg, ${primary}, ${secondary})`;
}

// Get contrasting text color
export function getContrastColor(hexColor: string): 'white' | 'black' {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'black' : 'white';
}
