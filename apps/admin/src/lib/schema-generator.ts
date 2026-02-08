/**
 * SCHEMA.ORG GENERATOR
 * Generates structured data (JSON-LD) for content pipeline Stage 7
 *
 * Produces:
 *   - BlogPosting (every article)
 *   - BreadcrumbList (every article)
 *   - FAQPage (conditional — detected from content)
 *   - HowTo (conditional — detected from content/title)
 */

import {
  ATE_YNA_AUTHOR,
  BPOC_PUBLISHER,
  SILO_MAP,
  BASE_URL,
  type SiloInfo,
} from './schema-constants';

// ============================================
// TYPES
// ============================================

export interface SchemaSet {
  article: Record<string, any>;
  breadcrumbs: Record<string, any>;
  faq: Record<string, any> | null;
  howTo: Record<string, any> | null;
}

export interface SchemaGeneratorInput {
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonicalSlug: string;
  focusKeyword: string;
  semanticKeywords?: string[];
  heroImageUrl?: string;
  publishDate?: string;
  modifiedDate?: string;
  silo?: string;
  isSiloPage?: boolean;
  articleContent: string;
  wordCount?: number;
}

// ============================================
// BlogPosting Schema
// ============================================

export function generateArticleSchema(input: SchemaGeneratorInput): Record<string, any> {
  const canonicalUrl = `${BASE_URL}/insights/${input.canonicalSlug}`;
  const now = new Date().toISOString();
  const wc =
    input.wordCount ||
    (input.articleContent ? input.articleContent.split(/\s+/).length : 0);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.metaTitle || input.title,
    description: input.metaDescription,
    datePublished: input.publishDate || now,
    dateModified: input.modifiedDate || now,
    author: { ...ATE_YNA_AUTHOR },
    publisher: { ...BPOC_PUBLISHER },
    image: input.heroImageUrl || `${BASE_URL}/images/og-insights.jpg`,
    url: canonicalUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    wordCount: wc,
    articleSection: resolveSiloName(input.silo),
    keywords: [
      input.focusKeyword,
      ...(input.semanticKeywords || []),
    ]
      .filter(Boolean)
      .join(', '),
    inLanguage: 'en',
  };
}

// ============================================
// BreadcrumbList Schema
// ============================================

export function generateBreadcrumbs(
  title: string,
  silo: string | undefined | null,
  canonicalSlug: string,
  isSiloPage: boolean = false
): Record<string, any> {
  const siloInfo = silo ? SILO_MAP[silo] : null;

  const items: Array<{ name: string; item: string }> = [
    { name: 'Home', item: BASE_URL },
    { name: 'Insights', item: `${BASE_URL}/insights` },
  ];

  if (siloInfo) {
    items.push({
      name: siloInfo.name,
      item: `${BASE_URL}/insights/${siloInfo.slug}`,
    });
  }

  // For non-silo-pages (regular articles), add article itself as the last crumb
  if (!isSiloPage) {
    items.push({
      name: title,
      item: `${BASE_URL}/insights/${canonicalSlug}`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

// ============================================
// FAQPage Schema (conditional)
// ============================================

interface FAQPair {
  question: string;
  answer: string;
}

/**
 * Detect FAQ-like content and generate FAQPage schema.
 * Detection strategies:
 *   1. Explicit FAQ sections (## FAQ, ## Frequently Asked Questions)
 *   2. H2/H3 headings that are questions (contain "?")
 *   3. Q&A formatted blocks (**Q:** / **A:** patterns)
 */
export function detectAndGenerateFAQ(content: string): { schema: Record<string, any>; count: number } | null {
  if (!content) return null;

  const pairs: FAQPair[] = [];

  // Strategy 1: Look for explicit FAQ sections
  const faqSectionRegex =
    /#{2,3}\s*(?:FAQ|Frequently\s+Asked\s+Questions|Common\s+Questions)[^\n]*\n([\s\S]*?)(?=\n#{1,2}\s|$)/gi;
  let faqMatch: RegExpExecArray | null;

  while ((faqMatch = faqSectionRegex.exec(content)) !== null) {
    const section = faqMatch[1];
    extractQAPairsFromSection(section, pairs);
  }

  // Strategy 2: H2/H3 headings that are questions (with "?")
  if (pairs.length === 0) {
    const questionHeadingRegex =
      /#{2,3}\s+(.+?\?)\s*\n([\s\S]*?)(?=\n#{2,3}\s|$)/g;
    let qMatch: RegExpExecArray | null;

    while ((qMatch = questionHeadingRegex.exec(content)) !== null) {
      const question = qMatch[1].trim();
      const answerBlock = qMatch[2].trim();
      // Take first paragraph as answer (strip markdown)
      const answer = extractFirstParagraph(answerBlock);

      if (question && answer && answer.length > 20) {
        pairs.push({ question, answer });
      }
    }
  }

  // Strategy 3: Q&A format blocks
  if (pairs.length === 0) {
    const qaRegex =
      /\*\*Q[:\.]?\s*(.+?)\*\*\s*\n+\s*(?:\*\*A[:\.]?\s*)?(.+?)(?=\n\s*\*\*Q|\n#{2,3}|$)/gi;
    let qaMatch: RegExpExecArray | null;

    while ((qaMatch = qaRegex.exec(content)) !== null) {
      const question = qaMatch[1].trim().replace(/\*\*/g, '');
      const answer = qaMatch[2].trim().replace(/\*\*/g, '').replace(/\n+/g, ' ');

      if (question && answer && answer.length > 20) {
        pairs.push({ question, answer });
      }
    }
  }

  if (pairs.length === 0) return null;

  // Limit to 10 FAQ items (Google recommendation)
  const limitedPairs = pairs.slice(0, 10);

  return {
    schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: limitedPairs.map((pair) => ({
        '@type': 'Question',
        name: pair.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: pair.answer,
        },
      })),
    },
    count: limitedPairs.length,
  };
}

/**
 * Extract Q&A pairs from an FAQ section block
 */
function extractQAPairsFromSection(section: string, pairs: FAQPair[]): void {
  // Try ### sub-headings first
  const subHeadingRegex = /###\s+(.+?)\n([\s\S]*?)(?=\n###\s|$)/g;
  let match: RegExpExecArray | null;
  let found = false;

  while ((match = subHeadingRegex.exec(section)) !== null) {
    found = true;
    const question = match[1].trim();
    const answer = extractFirstParagraph(match[2].trim());
    if (question && answer && answer.length > 20) {
      pairs.push({ question, answer });
    }
  }

  // Try bold Q&A format
  if (!found) {
    const boldQA =
      /\*\*(.+?\??)\*\*\s*\n+([\s\S]*?)(?=\n\*\*|$)/g;
    while ((match = boldQA.exec(section)) !== null) {
      const question = match[1].trim();
      const answer = extractFirstParagraph(match[2].trim());
      if (question && answer && answer.length > 20) {
        pairs.push({ question, answer });
      }
    }
  }

  // Try numbered list items with questions
  if (!found && pairs.length === 0) {
    const numberedRegex =
      /\d+\.\s+\*\*(.+?\??)\*\*\s*[-–:]?\s*([\s\S]*?)(?=\n\d+\.\s|\n#{2,3}|$)/g;
    while ((match = numberedRegex.exec(section)) !== null) {
      const question = match[1].trim();
      const answer = extractFirstParagraph(match[2].trim());
      if (question && answer && answer.length > 20) {
        pairs.push({ question, answer });
      }
    }
  }
}

// ============================================
// HowTo Schema (conditional)
// ============================================

interface HowToStep {
  name: string;
  text: string;
}

/**
 * Detect step-by-step / how-to content and generate HowTo schema.
 * Detection:
 *   1. Title contains "How to", "Guide to", "Steps to"
 *   2. Content has numbered steps ("Step 1:", "1. Do X")
 *   3. H2/H3 headings that are sequential steps
 */
export function detectAndGenerateHowTo(
  content: string,
  title: string,
  description?: string
): { schema: Record<string, any>; count: number } | null {
  if (!content) return null;

  // Check if title suggests how-to content
  const howToTitle = /\b(?:how\s+to|guide\s+to|steps?\s+to|step[- ]by[- ]step)\b/i.test(
    title
  );

  const steps: HowToStep[] = [];

  // Strategy 1: Explicit "Step N:" patterns
  const stepNRegex =
    /(?:^|\n)\s*(?:\*\*)?Step\s+(\d+)[:\.\)]\s*(?:\*\*)?\s*(.+?)(?:\*\*)?\s*\n([\s\S]*?)(?=\n\s*(?:\*\*)?Step\s+\d+|#{2,3}\s|$)/gi;
  let match: RegExpExecArray | null;

  while ((match = stepNRegex.exec(content)) !== null) {
    const stepName = match[2].trim().replace(/\*\*/g, '');
    const stepText = extractFirstParagraph(match[3].trim());
    if (stepName) {
      steps.push({
        name: stepName,
        text: stepText || stepName,
      });
    }
  }

  // Strategy 2: Numbered H2/H3 headings (## 1. Do something)
  if (steps.length === 0) {
    const numberedHeadingRegex =
      /#{2,3}\s+(\d+)[\.\)]\s+(.+)\n([\s\S]*?)(?=\n#{2,3}\s+\d+[\.\)]|#{1,2}\s|$)/g;

    while ((match = numberedHeadingRegex.exec(content)) !== null) {
      const stepName = match[2].trim();
      const stepText = extractFirstParagraph(match[3].trim());
      if (stepName) {
        steps.push({
          name: stepName,
          text: stepText || stepName,
        });
      }
    }
  }

  // Strategy 3: Numbered list items that look like steps (1. **Do X** — detail)
  if (steps.length === 0) {
    const numberedListRegex =
      /(?:^|\n)\s*(\d+)\.\s+\*\*(.+?)\*\*\s*[-–:]?\s*([\s\S]*?)(?=\n\s*\d+\.\s+\*\*|#{2,3}|$)/g;

    while ((match = numberedListRegex.exec(content)) !== null) {
      const stepName = match[2].trim();
      const stepText = extractFirstParagraph(match[3].trim()) || stepName;
      if (stepName) {
        steps.push({ name: stepName, text: stepText });
      }
    }
  }

  // Only generate HowTo if title suggests it OR we found 3+ steps
  if (steps.length < 3 && !howToTitle) return null;
  if (steps.length === 0) return null;

  // Limit to 20 steps
  const limitedSteps = steps.slice(0, 20);

  return {
    schema: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: title,
      description: description || '',
      step: limitedSteps.map((step, idx) => ({
        '@type': 'HowToStep',
        position: idx + 1,
        name: step.name,
        text: step.text,
      })),
    },
    count: limitedSteps.length,
  };
}

// ============================================
// COMBINED GENERATOR
// ============================================

export function generateAllSchemas(input: SchemaGeneratorInput): SchemaSet {
  // 1. BlogPosting (always)
  const article = generateArticleSchema(input);

  // 2. BreadcrumbList (always)
  const breadcrumbs = generateBreadcrumbs(
    input.title,
    input.silo,
    input.canonicalSlug,
    input.isSiloPage || false
  );

  // 3. FAQPage (conditional)
  const faqResult = detectAndGenerateFAQ(input.articleContent);
  const faq = faqResult ? faqResult.schema : null;

  // 4. HowTo (conditional)
  const howToResult = detectAndGenerateHowTo(
    input.articleContent,
    input.title,
    input.metaDescription
  );
  const howTo = howToResult ? howToResult.schema : null;

  return { article, breadcrumbs, faq, howTo };
}

/**
 * Generate a summary of detected schemas for UI display
 */
export function generateSchemaSummary(
  schemas: SchemaSet,
  input: SchemaGeneratorInput
): {
  blogPosting: boolean;
  breadcrumbPath: string;
  faqCount: number;
  howToSteps: number;
} {
  const siloInfo = input.silo ? SILO_MAP[input.silo] : null;
  const breadcrumbParts = ['Home', 'Insights'];

  if (siloInfo) {
    breadcrumbParts.push(siloInfo.name);
  }
  if (!input.isSiloPage) {
    breadcrumbParts.push(truncate(input.title, 40));
  }

  return {
    blogPosting: true,
    breadcrumbPath: breadcrumbParts.join(' → '),
    faqCount: schemas.faq
      ? (schemas.faq as any).mainEntity?.length || 0
      : 0,
    howToSteps: schemas.howTo
      ? (schemas.howTo as any).step?.length || 0
      : 0,
  };
}

// ============================================
// HELPERS
// ============================================

function resolveSiloName(siloId: string | undefined | null): string {
  if (!siloId) return 'BPO & Outsourcing';
  const info = SILO_MAP[siloId];
  return info ? info.name : 'BPO & Outsourcing';
}

/**
 * Extract the first meaningful paragraph from a markdown block.
 * Strips markdown formatting for clean schema text.
 */
function extractFirstParagraph(text: string): string {
  if (!text) return '';

  // Split into paragraphs (double newline)
  const paragraphs = text.split(/\n{2,}/);

  for (const para of paragraphs) {
    const cleaned = para
      .replace(/#{1,6}\s+/g, '') // Remove headings
      .replace(/\*\*(.+?)\*\*/g, '$1') // Bold → plain
      .replace(/\*(.+?)\*/g, '$1') // Italic → plain
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links → text
      .replace(/`(.+?)`/g, '$1') // Code → plain
      .replace(/^\s*[-*]\s+/gm, '') // Remove bullet markers
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
      .replace(/\n/g, ' ') // Flatten
      .trim();

    if (cleaned.length > 20) {
      return truncate(cleaned, 500);
    }
  }

  // Fallback: first line
  return truncate(text.replace(/\n/g, ' ').trim(), 500);
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}
