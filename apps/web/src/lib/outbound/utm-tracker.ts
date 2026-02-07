/**
 * UTM Link Tracking Utilities
 * Generate tracked links for email campaigns
 */

export interface UTMParams {
  source: string; // 'email'
  medium: string; // 'campaign'
  campaign: string; // 'migration_wave_1'
  content?: string; // 'cta_button', 'footer_link'
  term?: string; // Optional keyword
}

/**
 * Generate UTM tracking URL
 */
export function generateUTMLink(baseUrl: string, params: UTMParams): string {
  const url = new URL(baseUrl);

  // Add UTM parameters
  url.searchParams.set('utm_source', params.source);
  url.searchParams.set('utm_medium', params.medium);
  url.searchParams.set('utm_campaign', params.campaign);

  if (params.content) {
    url.searchParams.set('utm_content', params.content);
  }

  if (params.term) {
    url.searchParams.set('utm_term', params.term);
  }

  return url.toString();
}

/**
 * Generate tracked signup link for email campaigns
 */
export function generateSignupLink(campaignName: string, contentId?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bpoc.com';
  const signupUrl = `${baseUrl}/signup`;

  return generateUTMLink(signupUrl, {
    source: 'email',
    medium: 'campaign',
    campaign: campaignName,
    content: contentId || 'cta_button',
  });
}

/**
 * Generate tracked login link
 */
export function generateLoginLink(campaignName: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bpoc.com';
  const loginUrl = `${baseUrl}/login`;

  return generateUTMLink(loginUrl, {
    source: 'email',
    medium: 'campaign',
    campaign: campaignName,
    content: 'login_link',
  });
}

/**
 * Generate tracked job search link
 */
export function generateJobSearchLink(campaignName: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bpoc.com';
  const jobsUrl = `${baseUrl}/jobs`;

  return generateUTMLink(jobsUrl, {
    source: 'email',
    medium: 'campaign',
    campaign: campaignName,
    content: 'browse_jobs',
  });
}

/**
 * Replace all links in email template with UTM tracked versions
 */
export function addUTMToEmailLinks(htmlContent: string, campaignName: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bpoc.com';

  // Replace common patterns
  let tracked = htmlContent;

  // Signup links
  tracked = tracked.replace(
    /href="([^"]*\/signup[^"]*)"/gi,
    (match, url) => {
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
      const trackedUrl = generateSignupLink(campaignName, 'email_cta');
      return `href="${trackedUrl}"`;
    }
  );

  // Login links
  tracked = tracked.replace(
    /href="([^"]*\/login[^"]*)"/gi,
    (match, url) => {
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
      const trackedUrl = generateLoginLink(campaignName);
      return `href="${trackedUrl}"`;
    }
  );

  // Job search links
  tracked = tracked.replace(
    /href="([^"]*\/jobs[^"]*)"/gi,
    (match, url) => {
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
      const trackedUrl = generateJobSearchLink(campaignName);
      return `href="${trackedUrl}"`;
    }
  );

  // Generic BPOC links (catch-all)
  tracked = tracked.replace(
    /href="(https?:\/\/[^"]*bpoc\.com[^"]*)"/gi,
    (match, url) => {
      // Skip if already has UTM params
      if (url.includes('utm_source')) return match;

      const trackedUrl = generateUTMLink(url, {
        source: 'email',
        medium: 'campaign',
        campaign: campaignName,
        content: 'email_link',
      });
      return `href="${trackedUrl}"`;
    }
  );

  return tracked;
}

/**
 * Extract UTM params from URL or request
 */
export function extractUTMParams(url: string): Partial<UTMParams> | null {
  try {
    const urlObj = new URL(url);
    const params: Partial<UTMParams> = {};

    const source = urlObj.searchParams.get('utm_source');
    const medium = urlObj.searchParams.get('utm_medium');
    const campaign = urlObj.searchParams.get('utm_campaign');
    const content = urlObj.searchParams.get('utm_content');
    const term = urlObj.searchParams.get('utm_term');

    if (source) params.source = source;
    if (medium) params.medium = medium;
    if (campaign) params.campaign = campaign;
    if (content) params.content = content;
    if (term) params.term = term;

    return Object.keys(params).length > 0 ? params : null;
  } catch {
    return null;
  }
}

/**
 * Track site visit from UTM parameters
 */
export async function trackSiteVisit(email: string, utmParams: Partial<UTMParams>) {
  try {
    const response = await fetch('/api/admin/carpet-bomb/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ...utmParams }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to track visit:', error);
    return false;
  }
}
