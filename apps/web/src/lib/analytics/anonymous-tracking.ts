/**
 * DEPRECATED: Use @/components/analytics/AnalyticsProvider instead
 * This file is kept for backward compatibility
 */

export { 
  trackEvent as trackAnonEvent,
  trackConversion,
  trackClick as trackCTAClick,
  trackEvent
} from '@/components/analytics/AnalyticsProvider';

// Deprecated functions - now no-ops or redirects
export function initPageTracking(_pageName?: string): () => void {
  // Page tracking is now handled by AnalyticsProvider in layout
  return () => {};
}

export function trackSignupModal(action: 'open' | 'close' | 'abandoned'): void {
  const { trackEvent } = require('@/components/analytics/AnalyticsProvider');
  trackEvent(
    action === 'open' ? 'modal_open' : 'modal_close',
    'interaction',
    { modal: 'signup', abandoned: action === 'abandoned' }
  );
}

export function getAnonSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem('bpoc_anon_session');
  if (!sessionId) {
    sessionId = `anon-${crypto.randomUUID()}`;
    localStorage.setItem('bpoc_anon_session', sessionId);
  }
  return sessionId;
}

export function clearAnonSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('bpoc_anon_session');
  localStorage.removeItem('bpoc_utm');
  localStorage.removeItem('bpoc_landing');
}
