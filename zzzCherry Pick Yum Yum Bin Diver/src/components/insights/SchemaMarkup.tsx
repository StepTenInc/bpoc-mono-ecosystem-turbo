/**
 * SchemaMarkup — renders JSON-LD structured data <script> tags
 * Used in article render pages to inject schema.org data for rich snippets.
 *
 * Usage:
 *   <SchemaMarkup schemas={{ article: {...}, breadcrumbs: {...}, faq: null, howTo: null }} />
 */

interface SchemaMarkupProps {
  schemas: {
    article?: Record<string, any> | null;
    breadcrumbs?: Record<string, any> | null;
    faq?: Record<string, any> | null;
    howTo?: Record<string, any> | null;
  };
}

export function SchemaMarkup({ schemas }: SchemaMarkupProps) {
  if (!schemas) return null;

  return (
    <>
      {schemas.article && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.article) }}
        />
      )}
      {schemas.breadcrumbs && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.breadcrumbs) }}
        />
      )}
      {schemas.faq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.faq) }}
        />
      )}
      {schemas.howTo && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.howTo) }}
        />
      )}
    </>
  );
}
