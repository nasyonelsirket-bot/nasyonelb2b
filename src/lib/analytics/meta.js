import { META_CURRENCY, isMetaTrackablePath } from './metaConfig';
import {
  createEventId,
  getFbp,
  getFbc,
  ensureFbcFromUrl,
  buildMetaUserData,
} from './metaIdentity';
import {
  purchaseEventId,
  hasMetaPurchaseTracked,
  markMetaPurchaseTracked,
} from './metaPurchase';

let initializedPixelId = null;
const pendingFbq = [];

function resolvePath(pathname) {
  return pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
}

function canTrack(pathname) {
  return isMetaTrackablePath(resolvePath(pathname));
}

function callFbq(...args) {
  if (typeof window === 'undefined') return;
  if (typeof window.fbq === 'function') {
    window.fbq(...args);
    return;
  }
  pendingFbq.push(args);
}

function flushFbqQueue() {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  while (pendingFbq.length) {
    window.fbq(...pendingFbq.shift());
  }
}

function cartValue(items = []) {
  return items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0,
  );
}

function mapProduct(product, quantity = 1) {
  const id = String(product?.id ?? product?.sku ?? 'unknown');
  const qty = Math.max(1, Number(quantity) || 1);
  const price = Number(product?.price) || 0;
  return {
    id,
    name: String(product?.name || 'Ürün'),
    quantity: qty,
    price,
  };
}

function mapCartContents(items = []) {
  return (Array.isArray(items) ? items : []).map((item) => mapProduct(item, item.quantity));
}

function buildContentsPayload(items = []) {
  const mapped = mapCartContents(items);
  return {
    content_ids: mapped.map((i) => i.id),
    content_type: 'product',
    contents: mapped.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      item_price: i.price,
    })),
    num_items: mapped.reduce((sum, i) => sum + i.quantity, 0),
  };
}

async function relayCapiEvent({
  eventName,
  eventId,
  customData,
  userData,
  eventSourceUrl,
}) {
  if (typeof window === 'undefined') return;

  const payload = {
    event_name: eventName,
    event_id: eventId,
    event_source_url: eventSourceUrl || window.location.href,
    custom_data: customData,
    user_data: {
      fbp: getFbp() || undefined,
      fbc: getFbc() || undefined,
      ...buildMetaUserData(userData),
    },
  };

  try {
    await fetch('/api/meta/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: 'same-origin',
    });
  } catch {
    /* CAPI relay best-effort */
  }
}

function emitMetaEvent(eventName, customData, { userData, pathname, eventSourceUrl, eventId: eventIdOverride } = {}) {
  if (!canTrack(pathname)) return null;

  ensureFbcFromUrl();
  const eventId = eventIdOverride || createEventId();

  callFbq('track', eventName, customData, { eventID: eventId });

  relayCapiEvent({
    eventName,
    eventId,
    customData,
    userData,
    eventSourceUrl,
  });

  return eventId;
}

export function initMetaPixel(pixelId) {
  if (typeof window === 'undefined' || !pixelId) return false;
  if (initializedPixelId === pixelId && window.fbq) return true;

  if (!window.fbq) {
    const n = (window.fbq = function fbq(...args) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    });
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  window.fbq('init', pixelId);
  initializedPixelId = pixelId;
  flushFbqQueue();
  return true;
}

export function isMetaReady() {
  return Boolean(initializedPixelId && typeof window !== 'undefined' && window.fbq);
}

export function trackMetaPageView(params = {}) {
  if (!canTrack(params.pathname)) return;

  ensureFbcFromUrl();
  const eventId = createEventId();
  const sourceUrl = params.page_location || (typeof window !== 'undefined' ? window.location.href : '');

  callFbq('track', 'PageView', {}, { eventID: eventId });

  relayCapiEvent({
    eventName: 'PageView',
    eventId,
    customData: {},
    userData: {},
    eventSourceUrl: sourceUrl,
  });
}

export function trackMetaViewContent(product, pathname) {
  if (!product) return;
  const mapped = mapProduct(product, 1);

  emitMetaEvent(
    'ViewContent',
    {
      content_ids: [mapped.id],
      content_name: mapped.name,
      content_type: 'product',
      value: mapped.price,
      currency: META_CURRENCY,
      contents: [{ id: mapped.id, quantity: 1, item_price: mapped.price }],
    },
    { pathname },
  );
}

export function trackMetaAddToCart(product, quantity = 1, pathname) {
  if (!product) return;
  const mapped = mapProduct(product, quantity);

  emitMetaEvent(
    'AddToCart',
    {
      content_ids: [mapped.id],
      content_name: mapped.name,
      content_type: 'product',
      value: mapped.price * mapped.quantity,
      currency: META_CURRENCY,
      contents: [{ id: mapped.id, quantity: mapped.quantity, item_price: mapped.price }],
    },
    { pathname },
  );
}

export function trackMetaInitiateCheckout(items, { userData, pathname } = {}) {
  if (!items?.length) return;
  const contents = buildContentsPayload(items);
  const value = cartValue(items);

  emitMetaEvent(
    'InitiateCheckout',
    {
      ...contents,
      value,
      currency: META_CURRENCY,
    },
    { userData, pathname },
  );
}

export function trackMetaPurchase({
  transactionId,
  items = [],
  value,
  userData,
  pathname,
  eventSourceUrl,
}) {
  const orderId = String(transactionId || '').trim();
  if (!orderId) return null;
  if (hasMetaPurchaseTracked(orderId)) return null;

  const mappedItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const total = Number(value) || (mappedItems.length ? cartValue(mappedItems) : 0);
  if (!Number.isFinite(total) || total <= 0) return null;

  const contents = mappedItems.length ? buildContentsPayload(mappedItems) : {};
  const names = mappedItems.length
    ? mapCartContents(mappedItems).map((i) => i.name).join(', ')
    : undefined;

  const eventId = purchaseEventId(orderId) || createEventId();

  const customData = {
    value: total,
    currency: META_CURRENCY,
    order_id: orderId,
    ...(names ? { content_name: names } : {}),
    ...(mappedItems.length ? contents : {}),
  };

  const emittedId = emitMetaEvent('Purchase', customData, {
    userData,
    pathname,
    eventSourceUrl,
    eventId,
  });

  if (emittedId) {
    markMetaPurchaseTracked(orderId, emittedId);
  }

  return emittedId;
}
