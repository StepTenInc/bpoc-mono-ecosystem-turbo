'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Analytics functions - inline to avoid import issues during build
const ANON_SESSION_KEY = 'bpoc_anon_session';
const UTM_KEY = 'bpoc_utm';
const LANDING_KEY = 'bpoc_landing';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getAnonSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem(ANON_SESSION_KEY);
  if (!sessionId) {
    sessionId = `anon-${generateUUID()}`;
    localStorage.setItem(ANON_SESSION_KEY, sessionId);
  }
  return sessionId;
}

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

function captureUTM(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
    const value = params.get(key);
    if (value) utm[key] = value;
  });
  
  if (Object.keys(utm).length > 0) {
    localStorage.setItem(UTM_KEY, JSON.stringify(utm));
  }
  
  if (!localStorage.getItem(LANDING_KEY)) {
    localStorage.setItem(LANDING_KEY, window.location.pathname);
  }
  
  return utm;
}

function getStoredUTM(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(UTM_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Event queue for batching
let eventQueue: any[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
let isFlushing = false;

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
      eventQueue = [...eventsToSend, ...eventQueue];
      console.error('Analytics flush failed');
    }
  } catch (error) {
    eventQueue = [...eventsToSend, ...eventQueue];
    console.error('Analytics flush error:', error);
  } finally {
    isFlushing = false;
  }
}

function track(
  eventName: string,
  category: string = 'interaction',
  metadata?: Record<string, any>
): void {
  if (typeof window === 'undefined') return;
  
  const ua = navigator.userAgent;
  const utm = getStoredUTM();
  
  const event = {
    eventName,
    eventCategory: category,
    metadata,
    pagePath: window.location.pathname,
    pageTitle: document.title,
    context: {
      anonSessionId: getAnonSessionId(),
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
    },
    timestamp: new Date().toISOString()
  };
  
  eventQueue.push(event);
  
  if (eventQueue.length >= 5) {
    flushEvents();
  } else if (!flushTimeout) {
    flushTimeout = setTimeout(flushEvents, 10000);
  }
}

// Export for use in other components
export function trackEvent(
  eventName: string,
  category?: string,
  metadata?: Record<string, any>
): void {
  track(eventName, category || 'interaction', metadata);
}

export function trackConversion(
  eventName: string,
  metadata?: Record<string, any>
): void {
  track(eventName, 'conversion', metadata);
}

export function trackClick(ctaName: string, ctaLocation: string): void {
  track('cta_click', 'interaction', { cta_name: ctaName, cta_location: ctaLocation });
}

/**
 * Analytics Provider Component
 * Automatically tracks page views and handles route changes
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page view on route change
  useEffect(() => {
    // Capture UTM on every page load
    captureUTM();
    
    // Track page view
    track('page_view', 'page', {
      page_name: document.title,
      url: window.location.href,
      search: searchParams?.toString() || ''
    });
    
    // Track page exit on unload
    const handleUnload = () => {
      track('page_exit', 'page', {
        time_on_page: Math.floor(performance.now() / 1000)
      });
      
      // Force flush with sendBeacon
      if (navigator.sendBeacon && eventQueue.length > 0) {
        navigator.sendBeacon('/api/analytics/events', JSON.stringify({ events: eventQueue }));
        eventQueue = [];
      }
    };
    
    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [pathname, searchParams]);

  return <>{children}</>;
}

export default AnalyticsProvider;
