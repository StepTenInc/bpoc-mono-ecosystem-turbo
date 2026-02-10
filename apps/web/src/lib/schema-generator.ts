/**
 * Schema.org Structured Data Generator
 * Generates rich snippets for SEO and LLM crawling
 */

export interface SchemaInput {
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonicalSlug: string;
  focusKeyword: string;
  semanticKeywords: string[];
  heroImageUrl?: string;
  silo?: {
    name: string;
    slug?: string;
  };
  isSiloPage?: boolean;
  articleContent?: string;
}

export interface SchemaSet {
  article: any;
  breadcrumbs: any;
  faq?: any;
  howTo?: any;
  organization: any;
}

export interface SchemaSummary {
  breadcrumbPath: string;
  faqCount: number;
  howToSteps: number;
}

/**
 * Generate all schema markup for an article
 */
export function generateAllSchemas(input: SchemaInput): SchemaSet {
  return {
    article: generateArticleSchema(input),
    breadcrumbs: generateBreadcrumbs(input),
    faq: generateFAQSchema(input),
    howTo: generateHowToSchema(input),
    organization: generateOrganizationSchema(),
  };
}

/**
 * Generate summary of schema markup
 */
export function generateSchemaSummary(schemas: SchemaSet, input: SchemaInput): SchemaSummary {
  // Build breadcrumb path
  let breadcrumbPath = 'Home';
  if (input.silo?.name) {
    breadcrumbPath += ` → ${input.silo.name}`;
  }
  breadcrumbPath += ` → ${input.title}`;

  // Count FAQ questions
  let faqCount = 0;
  if (schemas.faq?.mainEntity) {
    faqCount = schemas.faq.mainEntity.length;
  }

  // Count HowTo steps
  let howToSteps = 0;
  if (schemas.howTo?.step) {
    howToSteps = schemas.howTo.step.length;
  }

  return {
    breadcrumbPath,
    faqCount,
    howToSteps,
  };
}

/**
 * Generate Article/BlogPosting schema
 */
function generateArticleSchema(input: SchemaInput): any {
  const baseUrl = 'https://bpoc.io';
  const articleUrl = `${baseUrl}/insights/${input.canonicalSlug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.metaTitle,
    description: input.metaDescription,
    url: articleUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    image: input.heroImageUrl || `${baseUrl}/og-image.png`,
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'BPOC',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'BPOC - BPO Career Guide',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    keywords: [input.focusKeyword, ...input.semanticKeywords].join(', '),
    articleSection: input.silo?.name || 'BPO Insights',
    inLanguage: 'en-PH',
  };
}

/**
 * Generate Breadcrumb schema
 */
function generateBreadcrumbs(input: SchemaInput): any {
  const baseUrl = 'https://bpoc.io';
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: baseUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Insights',
      item: `${baseUrl}/insights`,
    },
  ];

  let position = 3;

  if (input.silo?.name) {
    items.push({
      '@type': 'ListItem',
      position: position++,
      name: input.silo.name,
      item: `${baseUrl}/insights/${input.silo.slug || input.silo.name.toLowerCase().replace(/\s+/g, '-')}`,
    });
  }

  items.push({
    '@type': 'ListItem',
    position: position,
    name: input.title,
    item: `${baseUrl}/insights/${input.canonicalSlug}`,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

/**
 * Generate FAQ schema from article content
 */
function generateFAQSchema(input: SchemaInput): any | undefined {
  if (!input.articleContent) return undefined;

  // Extract Q&A patterns from content
  const faqPattern = /(?:^|\n)(?:##?\s*)?(?:Q:|Question:|\d+\.\s*)\s*(.+?)\s*\n+(?:A:|Answer:)?\s*(.+?)(?=\n(?:##?\s*)?(?:Q:|Question:|\d+\.)|$)/gis;
  const matches = [...input.articleContent.matchAll(faqPattern)];

  if (matches.length === 0) {
    // Try H2/H3 with question marks
    const h2Pattern = /#{2,3}\s*(.+\?)\s*\n+([^#]+)/g;
    const h2Matches = [...input.articleContent.matchAll(h2Pattern)];
    
    if (h2Matches.length === 0) return undefined;

    const faqItems = h2Matches.slice(0, 6).map(match => ({
      '@type': 'Question',
      name: match[1].trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: match[2].trim().slice(0, 500),
      },
    }));

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems,
    };
  }

  const faqItems = matches.slice(0, 6).map(match => ({
    '@type': 'Question',
    name: match[1].trim(),
    acceptedAnswer: {
      '@type': 'Answer',
      text: match[2].trim().slice(0, 500),
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems,
  };
}

/**
 * Generate HowTo schema from article content
 */
function generateHowToSchema(input: SchemaInput): any | undefined {
  if (!input.articleContent) return undefined;

  // Look for step patterns
  const stepPattern = /(?:Step\s*\d+[:.]\s*|^\d+\.\s*)(.+?)(?:\n|$)/gim;
  const matches = [...input.articleContent.matchAll(stepPattern)];

  if (matches.length < 3) return undefined; // Minimum 3 steps for HowTo

  const steps = matches.slice(0, 10).map((match, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: match[1].trim().slice(0, 100),
    text: match[1].trim(),
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: input.metaTitle,
    description: input.metaDescription,
    step: steps,
  };
}

/**
 * Generate Organization schema
 */
function generateOrganizationSchema(): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BPOC',
    alternateName: 'BPO Career Guide Philippines',
    url: 'https://bpoc.io',
    logo: 'https://bpoc.io/logo.png',
    description: 'Your trusted guide to BPO careers in the Philippines. Salary guides, company reviews, interview tips, and career advice.',
    sameAs: [
      'https://www.facebook.com/bpocph',
      'https://twitter.com/bpocph',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['en', 'tl'],
    },
  };
}

export default {
  generateAllSchemas,
  generateSchemaSummary,
};
