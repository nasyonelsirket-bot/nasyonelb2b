const STORAGE_KEY = 'nt_attribution';

export function captureAttribution() {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const data = {
      landing_page: window.location.pathname + window.location.search,
      referrer: document.referrer || '',
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      gclid: params.get('gclid') || '',
      fbclid: params.get('fbclid') || '',
      captured_at: new Date().toISOString(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'attribution_capture', ...data });
  } catch {
    /* ignore */
  }
}

export function getAttribution() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getAttributionForEvents() {
  const a = getAttribution();
  return {
    page_referrer: a.referrer || undefined,
    landing_page: a.landing_page || undefined,
    utm_source: a.utm_source || undefined,
    utm_medium: a.utm_medium || undefined,
    utm_campaign: a.utm_campaign || undefined,
  };
}
