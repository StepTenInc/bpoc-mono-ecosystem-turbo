/**
 * BPOC Analytics Tracking System v2
 * Clean, comprehensive tracking for anonymous + authenticated users
 */

import { v4 as uuidv4 } from 'uuid';

// ===========================
// Types
// ===========================

export type EventCategory = 
  | 'page'           // Page views
  | 'engagement'     // Scroll, time on page
  | 'conversion'     // Signup, resume upload
  | 'interaction'    // Clicks, form interactions
  | 'error';         // Errors, failures

export type EventName =
  // Page events
  | 'page_view'
  | 'page_exit'
  // Conversion events
  | 'resume_upload_start'
  | 'resume_upload_complete'
  | 'resume_analysis_complete'
  | 'signup_started'
  | 'signup_completed'
  | 'login'
  | 'job_applied'
  // Interaction events
  | 'cta_click'
  | 'modal_open'
  | 'modal_close'
  | 'form_start'
  | 'form_submit'
  | 'search'
  | 'filter_change'
  // Engagement events
  | 'scroll_depth'
  | 'video_play'
  | 'share_click'
  // Error events
  | 'error';

export interface TrackingContext {
  anonSessionId: string;
  userId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPage?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  userAgent: string;
}

export interface AnalyticsEvent {
  eventName: EventName | string;
  eventCategory: EventCategory;
  metadata?: Record<string, any>;
  pagePath?: string;
  pageTitle?: string;
}

// ===========================
// Device Detection
// ===========================

function detectDevice(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

function detectBrowser(ua: string): string {
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('FBAN') || ua.includes('FBAV')) return 'Facebook';
  if (ua.includes('Instagram')) return 'Instagram';
  return 'Other';
}

function detectOS(ua: string): string {
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
}

// ===========================
// UTM & Session Management
// ===========================

const ANON_SESSION_KEY = 'bpoc_anon_session';
const UTM_KEY = 'bpoc_utm';
const LANDING_KEY = 'bpoc_landing';

/**
 * Get or create anonymous session ID
 */
export function getAnonSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem(ANON_SESSION_KEY);
  if (!sessionId) {
    sessionId = `anon-${uuidv4()}`;
    localStorage.setItem(ANON_SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Clear anonymous session (call after signup/login to link sessions)
 */
export function clearAnonSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ANON_SESSION_KEY);
  localStorage.removeItem(UTM_KEY);
  localStorage.removeItem(LANDING_KEY);
}

/**
 * Capture UTM parameters from URL (call on page load)
 */
export function captureUTM(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};

  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
    const value = params.get(key);
    if (value) utm[key] = value;
  });

  // Store UTM params for the session
  if (Object.keys(utm).length > 0) {
    localStorage.setItem(UTM_KEY, JSON.stringify(utm));
  }

  // Store landing page if first visit
  if (!localStorage.getItem(LANDING_KEY)) {
    localStorage.setItem(LANDING_KEY, window.location.pathname);
  }

  return utm;
}

/**
 * Get stored UTM parameters
 */
export function getStoredUTM(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(UTM_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Get full tracking context
 */
export function getTrackingContext(userId?: string): TrackingContext {
  if (typeof window === 'undefined') {
    return {
      anonSessionId: '',
      deviceType: 'desktop',
      browser: 'Unknown',
      os: 'Unknown',
      userAgent: ''
    };
  }

  const ua = navigator.userAgent;
  const utm = getStoredUTM();

  return {
    anonSessionId: getAnonSessionId(),
    userId,
    utmSource: utm.utm_source,
    utmMedium: utm.utm_medium,
    utmCampaign: utm.utm_campaign,
    utmContent: utm.utm_content,
    utmTerm: utm.utm_term,
    referrer: document.referrer || undefined,
    landingPage: localStorage.getItem(LANDING_KEY) || undefined,
    deviceType: detectDevice(ua),
    browser: detectBrowser(ua),
    os: detectOS(ua),
    userAgent: ua
  };
}

// ===========================
// Event Tracking
// ===========================

let eventQueue: Array<AnalyticsEvent & { context: TrackingContext; timestamp: string }> = [];
let flushTimeout: NodeJS.Timeout | null = null;
let isFlushing = false;

/**
 * Track an analytics event
 */
export function track(
  eventName: EventName | string,
  category: EventCategory = 'interaction',
  metadata?: Record<string, any>,
  userId?: string
): void {
  if (typeof window === 'undefined') return;

  const context = getTrackingContext(userId);
  const event = {
    eventName,
    eventCategory: category,
    metadata,
    pagePath: window.location.pathname,
    pageTitle: document.title,
    context,
    timestamp: new Date().toISOString()
  };

  eventQueue.push(event);

  // Flush after 5 events or 10 seconds
  if (eventQueue.length >= 5) {
    flushEvents();
  } else if (!flushTimeout) {
    flushTimeout = setTimeout(flushEvents, 10000);
  }
}

/**
 * Track page view (convenience function)
 */
export function trackPageView(pageName?: string, userId?: string): void {
  // Capture UTM on every page view
  captureUTM();

  track('page_view', 'page', {
    page_name: pageName || document.title,
    url: window.location.href
  }, userId);
}

/**
 * Track CTA click (convenience function)
 */
export function trackClick(ctaName: string, ctaLocation: string, userId?: string): void {
  track('cta_click', 'interaction', {
    cta_name: ctaName,
    cta_location: ctaLocation
  }, userId);
}

/**
 * Track conversion event (convenience function)
 */
export function trackConversion(
  eventName: 'resume_upload_start' | 'resume_upload_complete' | 'resume_analysis_complete' | 'signup_started' | 'signup_completed' | 'job_applied',
  metadata?: Record<string, any>,
  userId?: string
): void {
  track(eventName, 'conversion', metadata, userId);
}

/**
 * Track error (convenience function)
 */
export function trackError(errorMessage: string, errorContext?: Record<string, any>, userId?: string): void {
  track('error', 'error', {
    error_message: errorMessage,
    ...errorContext
  }, userId);
}

// ===========================
// Server Sync
// ===========================

/**
 * Flush events to server
 */
async function flushEvents(): Promise<void> {
  if (typeof window === 'undefined' || isFlushing || eventQueue.length === 0) return;

  isFlushing = true;

  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  const eventsToSend = [...eventQueue];
  eventQueue = [];

  try {
    const response = await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: eventsToSend })
    });

    if (!response.ok) {
      // Re-queue events on failure
      eventQueue = [...eventsToSend, ...eventQueue];
      console.error('Analytics flush failed:', await response.text());
    }
  } catch (error) {
    // Re-queue events on error
    eventQueue = [...eventsToSend, ...eventQueue];
    console.error('Analytics flush error:', error);
  } finally {
    isFlushing = false;
  }
}

/**
 * Force flush (call before page unload)
 */
export function forceFlush(): void {
  if (eventQueue.length > 0) {
    // Use sendBeacon for reliability on page unload
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/events', JSON.stringify({ events: eventQueue }));
      eventQueue = [];
    } else {
      flushEvents();
    }
  }
}

// ===========================
// React Integration
// ===========================

/**
 * Initialize tracking on page mount
 * Returns cleanup function
 */
export function initPageTracking(pageName?: string, userId?: string): () => void {
  if (typeof window === 'undefined') return () => {};

  // Capture UTM on first load
  captureUTM();

  // Track page view
  trackPageView(pageName, userId);

  // Track page exit on unload
  const handleUnload = () => {
    track('page_exit', 'page', {
      page_name: pageName || document.title,
      time_on_page: Math.floor(performance.now() / 1000)
    }, userId);
    forceFlush();
  };

  window.addEventListener('beforeunload', handleUnload);

  return () => {
    window.removeEventListener('beforeunload', handleUnload);
  };
}

// ===========================
// Session Linking
// ===========================

/**
 * Link anonymous session to user after signup/login
 */
export async function linkSessionToUser(userId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const anonSessionId = getAnonSessionId();

  try {
    await fetch('/api/analytics/link-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anonSessionId, userId })
    });

    // Clear anonymous session after linking
    clearAnonSession();
  } catch (error) {
    console.error('Failed to link session:', error);
  }
}

// ===========================
// Debug
// ===========================

export function getDebugInfo(): Record<string, any> {
  return {
    context: getTrackingContext(),
    queueLength: eventQueue.length,
    utm: getStoredUTM()
  };
}
