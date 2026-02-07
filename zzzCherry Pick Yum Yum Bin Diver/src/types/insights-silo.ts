/**
 * INSIGHTS SILO STRUCTURE - TypeScript Types
 * 
 * Properly typed silo structure with Pillar/Supporting content
 */

export type ContentType = 'pillar' | 'supporting' | 'hub';

export type SiloTopic = 
  | 'Salary Guide'
  | 'Regularization'
  | 'Benefits & Rights'
  | 'Leaves & Time Off'
  | 'Resignation & Termination'
  | 'Working Hours'
  | 'Employment Contracts'
  | 'Job Hunting';

export interface InsightPost {
  id: string;
  slug: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  
  // Silo Structure
  content_type: ContentType;
  silo_topic?: SiloTopic | string;
  pillar_page_id?: string;
  
  // Author
  author: string;
  author_slug: string;
  read_time?: string;
  
  // Visuals
  icon_name?: string;
  color?: string;
  bg_color?: string;
  hero_type: 'image' | 'video';
  hero_url?: string;
  video_url?: string;
  
  // Split content (Emman's feature)
  content_part1?: string;
  content_part2?: string;
  content_part3?: string;
  content_image0?: string;
  content_image1?: string;
  content_image2?: string;
  
  // Status
  is_published: boolean;
  published_at?: string;
  view_count?: number;
  
  // AI Pipeline
  hr_kb_articles?: string[];
  serper_research?: any;
  personality_profile?: any;
  humanization_score?: number;
  ai_logs?: any[];
  pipeline_stage?: string;
  generation_metadata?: any;
  
  // SEO (from seo_metadata table)
  seo?: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
    canonical_url?: string;
    og_image?: string;
    schema_type?: string;
    schema_data?: any;
  };
  
  // Links
  applied_links?: any[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface SiloStructure {
  pillar_id: string;
  pillar_title: string;
  pillar_slug: string;
  silo_topic: string;
  pillar_published: boolean;
  supporting_articles_count: number;
  published_supporting_count: number;
  pillar_views: number;
  created_at: string;
  updated_at: string;
}

export interface CreateInsightDTO {
  title: string;
  slug: string;
  content: string;
  
  // REQUIRED: Mark as pillar or supporting
  content_type: ContentType;
  silo_topic?: string; // Required if content_type = 'pillar'
  pillar_page_id?: string; // Required if content_type = 'supporting'
  
  // Optional
  description?: string;
  category?: string;
  author?: string;
  hero_type?: 'image' | 'video';
  hero_url?: string;
}

// Helper functions
export function isPillarPage(insight: InsightPost): boolean {
  return insight.content_type === 'pillar';
}

export function isSupportingContent(insight: InsightPost): boolean {
  return insight.content_type === 'supporting';
}

export function getSiloArticles(insights: InsightPost[], siloTopic: string) {
  const pillar = insights.find(i => i.content_type === 'pillar' && i.silo_topic === siloTopic);
  const supporting = insights.filter(i => i.content_type === 'supporting' && i.pillar_page_id === pillar?.id);
  
  return {
    pillar,
    supporting,
    total: supporting.length,
    published: supporting.filter(s => s.is_published).length,
  };
}

