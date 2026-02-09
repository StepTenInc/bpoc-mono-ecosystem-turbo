/**
 * Anonymous Analytics Tracking System
 * Tracks anonymous user behavior before signup for lead generation and user insights
 */

import { v4 as uuidv4 } from 'uuid';

// ===========================
// Session Management
// ===========================

/**
 * Get or create anonymous session ID
 */
export function getAnonSessionId(): string {
  if (typeof window === 'undefined') return '';

  const existing = localStorage.getItem('anon_session_id');
  if (existing) return existing;

  const newId = `anon-${uuidv4()}`;
  localStorage.setItem('anon_session_id', newId);
  return newId;
}

/**
 * Clear anonymous session (call on signup/login)
 */
export function clearAnonSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('anon_session_id');
}

// ===========================
// Event Types
// ===========================

export type AnonEventType =
  | 'page_view'
  | 'resume_upload_start'
  | 'resume_upload_complete'
  | 'resume_analysis_complete'
  | 'cta_click'
  | 'signup_modal_open'
  | 'signup_modal_close'
  | 'signup_abandoned'
  | 'chat_message_sent'
  | 'chat_opened'
  | 'chat_closed'
  | 'insight_article_view'
  | 'career_game_start'
  | 'career_game_complete'
  | 'link_click';

export interface AnonEvent {
  event_type: AnonEventType;
  event_data?: Record<string, any>;
  timestamp: string;
  page_url: string;
  page_title: string;
  referrer?: string;
}

export interface AnonAnalytics {
  session_id: string;
  events: AnonEvent[];
  page_views: {
    url: string;
    title: string;
    timestamp: string;
    duration?: number;
  }[];
  first_seen: string;
  last_seen: string;
  total_events: number;
  user_agent?: string;
}

// ===========================
// Local Storage Management
// ===========================

const ANALYTICS_KEY = 'anon_analytics';

/**
 * Get current analytics data from localStorage
 */
function getAnalyticsData(): AnonAnalytics {
  if (typeof window === 'undefined') {
    return {
      session_id: '',
      events: [],
      page_views: [],
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      total_events: 0
    };
  }

  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse analytics data:', e);
  }

  // Initialize new analytics data
  const sessionId = getAnonSessionId();
  const now = new Date().toISOString();
  return {
    session_id: sessionId,
    events: [],
    page_views: [],
    first_seen: now,
    last_seen: now,
    total_events: 0,
    user_agent: navigator.userAgent
  };
}

/**
 * Save analytics data to localStorage
 */
function saveAnalyticsData(data: AnonAnalytics): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save analytics data:', e);
  }
}

// ===========================
// Event Tracking
// ===========================

/**
 * Track an anonymous event
 */
export function trackAnonEvent(
  eventType: AnonEventType,
  eventData?: Record<string, any>
): void {
  if (typeof window === 'undefined') return;

  const analytics = getAnalyticsData();
  const event: AnonEvent = {
    event_type: eventType,
    event_data: eventData,
    timestamp: new Date().toISOString(),
    page_url: window.location.href,
    page_title: document.title,
    referrer: document.referrer || undefined
  };

  analytics.events.push(event);
  analytics.last_seen = event.timestamp;
  analytics.total_events++;

  saveAnalyticsData(analytics);

  // Debounced sync to server (every 5 events or 30 seconds)
  queueSync();
}

/**
 * Track page view
 */
export function trackPageView(url?: string, title?: string): void {
  if (typeof window === 'undefined') return;

  const currentUrl = url || window.location.href;
  const now = Date.now();

  // Prevent duplicate tracking of same URL within 2 seconds
  if (lastTrackedUrl === currentUrl && (now - lastTrackTime) < 2000) {
    return;
  }

  lastTrackedUrl = currentUrl;
  lastTrackTime = now;

  const analytics = getAnalyticsData();
  const pageView = {
    url: currentUrl,
    title: title || document.title,
    timestamp: new Date().toISOString()
  };

  analytics.page_views.push(pageView);
  analytics.last_seen = pageView.timestamp;

  saveAnalyticsData(analytics);

  // Also track as event
  trackAnonEvent('page_view', {
    url: pageView.url,
    title: pageView.title
  });
}

/**
 * Track CTA click
 */
export function trackCTAClick(ctaName: string, ctaLocation: string): void {
  trackAnonEvent('cta_click', {
    cta_name: ctaName,
    cta_location: ctaLocation
  });
}

/**
 * Track signup modal interactions
 */
export function trackSignupModal(action: 'open' | 'close' | 'abandoned'): void {
  const eventType =
    action === 'open' ? 'signup_modal_open' :
    action === 'close' ? 'signup_modal_close' :
    'signup_abandoned';

  trackAnonEvent(eventType, { action });
}

/**
 * Track chat interactions
 */
export function trackChatEvent(
  action: 'opened' | 'closed' | 'message_sent',
  messageData?: { message?: string; response?: string }
): void {
  const eventType =
    action === 'opened' ? 'chat_opened' :
    action === 'closed' ? 'chat_closed' :
    'chat_message_sent';

  trackAnonEvent(eventType, {
    action,
    ...messageData
  });
}

// ===========================
// Server Sync
// ===========================

let syncTimeout: NodeJS.Timeout | null = null;
let syncCounter = 0;
let isSyncing = false; // Prevent concurrent syncs
let lastTrackedUrl: string | null = null; // Prevent duplicate page views
let lastTrackTime = 0; // Timestamp of last track

/**
 * Queue analytics sync to server
 */
function queueSync(): void {
  syncCounter++;

  // Sync every 5 events or every 30 seconds
  const shouldSync = syncCounter >= 5;

  if (shouldSync && !isSyncing) {
    syncToServer();
    syncCounter = 0;
  } else if (!isSyncing) {
    // Debounce: sync after 30 seconds of inactivity
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      if (!isSyncing) {
        syncToServer();
        syncCounter = 0;
      }
    }, 30000);
  }
}

/**
 * Sync analytics data to server
 */
export async function syncToServer(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Prevent concurrent syncs
  if (isSyncing) return;

  isSyncing = true;

  try {
    const analytics = getAnalyticsData();

    // Don't sync if no events
    if (analytics.events.length === 0 && analytics.page_views.length === 0) {
      return;
    }

    const response = await fetch('/api/anon/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anon_session_id: analytics.session_id,
        channel: 'analytics-tracking',
        payload: {
          analytics,
          synced_at: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      console.error('Failed to sync analytics:', await response.text());
    }
  } catch (error) {
    console.error('Analytics sync error:', error);
  } finally {
    isSyncing = false;
  }
}

/**
 * Get current analytics summary (useful for debugging)
 */
export function getAnalyticsSummary(): {
  sessionId: string;
  totalEvents: number;
  totalPageViews: number;
  firstSeen: string;
  lastSeen: string;
} {
  const analytics = getAnalyticsData();
  return {
    sessionId: analytics.session_id,
    totalEvents: analytics.total_events,
    totalPageViews: analytics.page_views.length,
    firstSeen: analytics.first_seen,
    lastSeen: analytics.last_seen
  };
}

/**
 * Clear all analytics data (for testing or user request)
 */
export function clearAnalyticsData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ANALYTICS_KEY);
}

// ===========================
// Hook for React Components
// ===========================

/**
 * Initialize analytics tracking for a page
 * Call this in useEffect on page mount
 * Returns cleanup function to remove event listeners
 */
export function initPageTracking(pageName?: string): (() => void) | undefined {
  if (typeof window === 'undefined') return;

  // Ensure session ID exists
  getAnonSessionId();

  // Track page view
  trackPageView(undefined, pageName);

  // Track page exit/duration
  const startTime = Date.now();

  const handleBeforeUnload = () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const analytics = getAnalyticsData();

    if (analytics.page_views.length > 0) {
      const lastPageView = analytics.page_views[analytics.page_views.length - 1];
      lastPageView.duration = duration;
      saveAnalyticsData(analytics);
    }

    // Force sync before leaving
    syncToServer();
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  // Cleanup
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}
