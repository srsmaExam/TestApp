/**
 * Google Analytics (GA4) & Campaign Tracking Utilities
 * 
 * Safe client-side helpers to track pageviews, custom conversion events,
 * and preserve UTM campaign parameters across student sessions.
 */

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
const STORAGE_PREFIX = 'srsma_';

/**
 * Capture UTM parameters from current URL and persist to sessionStorage
 * so that attribution isn't lost when the user navigates between pages.
 */
export function captureAndPersistUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const captured: UtmParams = {};

    UTM_KEYS.forEach((key) => {
      const value = urlParams.get(key);
      if (value) {
        captured[key] = value;
        sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
      } else {
        // Fallback to existing session value if already stored earlier in session
        const stored = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
        if (stored) {
          captured[key] = stored;
        }
      }
    });

    return captured;
  } catch {
    return {};
  }
}

/**
 * Get stored UTM parameters for lead attribution or API calls
 */
export function getPersistedUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};

  try {
    const params: UtmParams = {};
    UTM_KEYS.forEach((key) => {
      const stored = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (stored) {
        params[key] = stored;
      }
    });
    return params;
  } catch {
    return {};
  }
}

/**
 * Send a custom event to Google Analytics (gtag.js)
 */
export function trackGaEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag === 'function') {
    w.gtag('event', eventName, params);
  }
}

/**
 * Track Call-to-Action button click
 */
export function trackCtaClick(ctaName: string, location?: string) {
  trackGaEvent('cta_click', {
    cta_name: ctaName,
    page_location: location || (typeof window !== 'undefined' ? window.location.pathname : undefined),
    ...getPersistedUtmParams(),
  });
}
