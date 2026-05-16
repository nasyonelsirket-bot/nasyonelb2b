import { GA4_CURRENCY, isGa4TrackablePath } from './ga4Config';

const eventQueue = [];
let initializedId = null;

function gtag(...args) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    window.gtag(...args);
    return;
  }
  eventQueue.push(args);
}

function flushQueue() {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  while (eventQueue.length) {
    window.gtag(...eventQueue.shift());
  }
}

/**
 * GA4 gtag.js yükler ve yapılandırır (SPA: manuel page_view).
 * @param {string} measurementId
 */
export function initGa4(measurementId) {
  if (typeof window === 'undefined' || !measurementId) return false;
  if (initializedId === measurementId && window.gtag) return true;

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtagFn() {
      window.dataLayer.push(arguments);
    };
  }

  const existing = document.querySelector(`script[data-ga4-id="${measurementId}"]`);
  if (!existing) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.setAttribute('data-ga4-id', measurementId);
    document.head.appendChild(script);
  }

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
    cookie_flags: 'SameSite=None;Secure',
    anonymize_ip: true,
  });

  initializedId = measurementId;
  flushQueue();
  return true;
}

export function isGa4Ready() {
  return Boolean(initializedId && typeof window !== 'undefined' && window.gtag);
}

export function mapProductToGa4Item(product, quantity = 1) {
  const price = Number(product?.price) || 0;
  const qty = Math.max(1, Number(quantity) || 1);
  return {
    item_id: String(product?.id ?? product?.sku ?? 'unknown'),
    item_name: String(product?.name ?? 'Ürün'),
    item_category: String(product?.category ?? ''),
    item_brand: 'Nasyonel Toys',
    price,
    quantity: qty,
  };
}

export function mapCartItemsToGa4(items = []) {
  return items.map((item) => mapProductToGa4Item(item, item.quantity));
}

function cartValue(items = []) {
  return items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
}

function resolvePath(pathname) {
  return pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
}

function canTrack(pathname) {
  return isGa4TrackablePath(resolvePath(pathname));
}

/**
 * @param {{ page_path?: string, page_title?: string, page_location?: string }} params
 */
export function trackPageView(params = {}) {
  const pathname = params.page_path || (typeof window !== 'undefined' ? window.location.pathname : '/');
  if (!canTrack(pathname)) return;

  gtag('event', 'page_view', {
    page_path: params.page_path || pathname,
    page_title: params.page_title || document.title,
    page_location: params.page_location || window.location.href,
  });
}

/**
 * GA4 önerilen etkinlik: view_item
 */
export function trackViewItem(product, pathname) {
  if (!product || !canTrack(pathname)) return;
  const item = mapProductToGa4Item(product, 1);
  gtag('event', 'view_item', {
    currency: GA4_CURRENCY,
    value: item.price,
    items: [item],
  });
}

/**
 * GA4 önerilen etkinlik: add_to_cart
 */
export function trackAddToCart(product, quantity = 1, pathname) {
  if (!product || !canTrack(pathname)) return;
  const item = mapProductToGa4Item(product, quantity);
  gtag('event', 'add_to_cart', {
    currency: GA4_CURRENCY,
    value: item.price * item.quantity,
    items: [item],
  });
}

/**
 * GA4 önerilen etkinlik: begin_checkout
 */
export function trackBeginCheckout(items, pathname) {
  if (!items?.length || !canTrack(pathname)) return;
  const gaItems = mapCartItemsToGa4(items);
  gtag('event', 'begin_checkout', {
    currency: GA4_CURRENCY,
    value: cartValue(items),
    items: gaItems,
  });
}

/**
 * GA4 önerilen etkinlik: purchase
 */
export function trackPurchase({
  transactionId,
  items,
  value,
  shipping = 0,
  coupon = '',
  pathname,
}) {
  if (!transactionId || !items?.length || !canTrack(pathname)) return;
  gtag('event', 'purchase', {
    transaction_id: String(transactionId),
    currency: GA4_CURRENCY,
    value: Number(value) || cartValue(items),
    shipping: Number(shipping) || 0,
    coupon: coupon || undefined,
    items: mapCartItemsToGa4(items),
  });
}
