/**
 * Meta Conversion API — sunucu tarafı event gönderimi
 * https://developers.facebook.com/docs/marketing-api/conversions-api
 */
const crypto = require('crypto');

const GRAPH_API_VERSION = 'v21.0';
const ALLOWED_EVENTS = new Set([
  'PageView',
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'Purchase',
]);

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) digits = `90${digits.slice(1)}`;
  else if (!digits.startsWith('90')) digits = `90${digits}`;
  return digits;
}

function hashField(value, type) {
  let normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return null;

  if (type === 'phone') {
    normalized = normalizePhone(value);
    if (!normalized) return null;
  }

  return sha256(normalized);
}

function buildHashedUserData(raw = {}, { clientIp, userAgent } = {}) {
  const out = {};

  const em = hashField(raw.em || raw.email, 'email');
  const ph = hashField(raw.ph || raw.phone, 'phone');
  const fn = hashField(raw.fn || raw.first_name, 'text');
  const ln = hashField(raw.ln || raw.last_name, 'text');
  const ct = hashField(raw.ct || raw.city, 'text');
  const country = hashField(raw.country || 'tr', 'text');
  const externalId = hashField(raw.external_id || raw.externalId, 'text');

  if (em) out.em = [em];
  if (ph) out.ph = [ph];
  if (fn) out.fn = [fn];
  if (ln) out.ln = [ln];
  if (ct) out.ct = [ct];
  if (country) out.country = [country];
  if (externalId) out.external_id = [externalId];

  if (raw.fbp) out.fbp = String(raw.fbp).trim();
  if (raw.fbc) out.fbc = String(raw.fbc).trim();
  if (clientIp) out.client_ip_address = clientIp;
  if (userAgent) out.client_user_agent = userAgent;

  return out;
}

function resolvePixelId() {
  return String(process.env.META_PIXEL_ID || process.env.VITE_META_PIXEL_ID || '961867176690620').trim();
}

function resolveAccessToken() {
  return String(process.env.META_CAPI_ACCESS_TOKEN || '').trim();
}

function resolveTestEventCode() {
  return String(process.env.META_TEST_EVENT_CODE || '').trim();
}

async function sendMetaEvents(events) {
  const pixelId = resolvePixelId();
  const accessToken = resolveAccessToken();
  if (!pixelId || !accessToken) {
    return { ok: false, skipped: true, reason: 'META_CAPI_ACCESS_TOKEN veya META_PIXEL_ID tanımlı değil' };
  }

  const testEventCode = resolveTestEventCode();
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`;

  const body = {
    data: events,
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = json?.error?.message || res.statusText || 'Meta CAPI error';
    return { ok: false, error: err, details: json };
  }

  return {
    ok: true,
    events_received: json.events_received,
    fbtrace_id: json.fbtrace_id,
    test_mode: Boolean(testEventCode),
  };
}

function buildServerEvent(payload, context = {}) {
  const eventName = String(payload.event_name || '').trim();
  if (!ALLOWED_EVENTS.has(eventName)) {
    throw new Error(`Desteklenmeyen event: ${eventName}`);
  }

  const eventId = String(payload.event_id || '').trim();
  if (!eventId) throw new Error('event_id gerekli');

  const eventSourceUrl = String(payload.event_source_url || '').trim();
  if (!eventSourceUrl) throw new Error('event_source_url gerekli');

  const customData = payload.custom_data && typeof payload.custom_data === 'object'
    ? payload.custom_data
    : {};

  const userData = buildHashedUserData(payload.user_data || {}, context);

  return {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: userData,
    custom_data: customData,
  };
}

module.exports = {
  ALLOWED_EVENTS,
  buildServerEvent,
  sendMetaEvents,
  hashField,
};
