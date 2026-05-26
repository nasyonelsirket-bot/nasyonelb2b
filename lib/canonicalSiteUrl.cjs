/** Production canonical origin — Google Merchant, SEO, PayTR return URLs */
const CANONICAL_SITE_URL = 'https://nasyoneltoys.com';

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

/** Resolve site origin from env/settings. Never returns netlify.app. */
function resolveCanonicalSiteUrl(...candidates) {
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

/** Rewrite any URL to canonical production origin when host is netlify / www / apex. */
function rewriteUrlToCanonical(url) {
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

module.exports = {
  CANONICAL_SITE_URL,
  resolveCanonicalSiteUrl,
  rewriteUrlToCanonical,
};
