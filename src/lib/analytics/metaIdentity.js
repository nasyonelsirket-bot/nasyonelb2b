/** Meta event deduplication + fbp/fbc identity helpers */

const FBC_MAX_AGE_DAYS = 90;

function readCookie(name) {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

function writeCookie(name, value, maxAgeDays) {
  if (typeof document === 'undefined') return;
  const maxAge = Math.max(1, maxAgeDays) * 24 * 60 * 60;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

export function createEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function getFbp() {
  return readCookie('_fbp');
}

export function getFbc() {
  return readCookie('_fbc');
}

/** fbclid geldiğinde Meta _fbc çerezini oluşturur (EMQ + attribution) */
export function ensureFbcFromUrl() {
  if (typeof window === 'undefined') return;
  if (getFbc()) return;

  const fbclid = new URLSearchParams(window.location.search).get('fbclid');
  if (!fbclid) return;

  writeCookie('_fbc', `fb.1.${Date.now()}.${fbclid}`, FBC_MAX_AGE_DAYS);
}

export function splitCustomerName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { fn: '', ln: '' };
  if (parts.length === 1) return { fn: parts[0], ln: parts[0] };
  return { fn: parts[0], ln: parts.slice(1).join(' ') };
}

/** CAPI user_data — sunucu tarafında hash'lenir */
export function buildMetaUserData(customer = {}) {
  const c = customer && typeof customer === 'object' ? customer : {};
  const { fn, ln } = splitCustomerName(c.name);
  const city = String(c.city || c.district || '').trim();

  return {
    em: String(c.email || '').trim() || undefined,
    ph: String(c.phone || '').trim() || undefined,
    fn: fn || undefined,
    ln: ln || undefined,
    ct: city || undefined,
    country: 'tr',
    external_id: String(c.externalId || c.external_id || '').trim() || undefined,
  };
}
