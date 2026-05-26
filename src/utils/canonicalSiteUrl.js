/** Production canonical origin — Google Merchant, SEO, structured data */
export const CANONICAL_SITE_URL = 'https://nasyoneltoys.com';

function stripTrailingSlash(url) {
  return String(url || '').trim().replace(/\/$/, '');
}

function isNonProductionHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  if (!h) return true;
  return (
    h.endsWith('.netlify.app') ||
    h === 'localhost' ||
    h.startsWith('127.0.0.1') ||
    h.endsWith('.localhost')
  );
}

function isOurDomain(hostname) {
  const h = String(hostname || '').toLowerCase();
  return h === 'nasyoneltoys.com' || h === 'www.nasyoneltoys.com';
}

export function resolveCanonicalSiteUrl(...candidates) {
  for (const candidate of candidates) {
    const raw = String(candidate || '').trim();
    if (!raw) continue;
    try {
      const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      const { hostname, protocol } = new URL(href);
      if (isNonProductionHost(hostname)) continue;
      if (isOurDomain(hostname)) return CANONICAL_SITE_URL;
      return stripTrailingSlash(`${protocol}//${hostname}`);
    } catch {
      // skip invalid
    }
  }
  return CANONICAL_SITE_URL;
}

export function rewriteUrlToCanonical(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';

  try {
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw);
      if (isNonProductionHost(u.hostname) || isOurDomain(u.hostname)) {
        return `${CANONICAL_SITE_URL}${u.pathname}${u.search}${u.hash}`.slice(0, 512);
      }
      return raw.slice(0, 512);
    }
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    return `${CANONICAL_SITE_URL}${path}`.slice(0, 512);
  } catch {
    return raw.slice(0, 512);
  }
}

/** Site origin for SEO, orders, admin previews */
export function getSiteUrl(settings = {}) {
  return resolveCanonicalSiteUrl(
    settings?.siteUrl,
    import.meta.env.VITE_SITE_URL,
    typeof window !== 'undefined' ? window.location.origin : '',
  );
}
