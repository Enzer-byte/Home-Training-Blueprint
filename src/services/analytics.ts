import { AnalyticsStats } from '../types';

const LOCAL_ANALYTICS_KEY = 'home_training_blueprint_cta_clicks';

interface TrackPayload {
  buttonId: string;
  buttonLabel: string;
  targetUrl: string;
  referrer: string;
  timestamp: string;
}

/**
 * Lightweight client-side tracker for Buy CTAs
 * Uses navigator.sendBeacon with fire-and-forget, with fallback to keepalive fetch
 */
export function trackCtaClick(buttonId: string, buttonLabel: string, targetUrl: string): void {
  try {
    // Record in local cache as instant backup
    const localRaw = localStorage.getItem(LOCAL_ANALYTICS_KEY);
    const localData: Record<string, number> = localRaw ? JSON.parse(localRaw) : { total: 0 };
    localData[buttonId] = (localData[buttonId] || 0) + 1;
    localData.total = (localData.total || 0) + 1;
    localStorage.setItem(LOCAL_ANALYTICS_KEY, JSON.stringify(localData));

    const payload: TrackPayload = {
      buttonId,
      buttonLabel,
      targetUrl,
      referrer: document.referrer || '',
      timestamp: new Date().toISOString()
    };

    const endpoint = '/api/analytics/track';
    const jsonString = JSON.stringify(payload);

    // Prefer navigator.sendBeacon for non-blocking telemetry on link navigation
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const sent = navigator.sendBeacon(endpoint, blob);
      if (sent) return;
    }

    // Fallback to fetch with keepalive: true
    if (typeof fetch !== 'undefined') {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonString,
        keepalive: true
      }).catch(() => {
        // Silent error handling for client tracker
      });
    }
  } catch (err) {
    console.debug('CTA click tracking caught error:', err);
  }
}

export function getLocalCachedStats(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LOCAL_ANALYTICS_KEY);
    return raw ? JSON.parse(raw) : { total: 0 };
  } catch {
    return { total: 0 };
  }
}
