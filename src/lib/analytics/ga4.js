import { GA4_CURRENCY, isGa4TrackablePath } from './ga4Config';
import { productFlatParams, aggregateFlatParams } from './ga4Params';
import { getAttributionForEvents, captureAttribution } from './attribution';

export { captureAttribution };

const eventQueue = [];
let initializedId = null;

const ORDER_FORM_NAME = 'retail_order_customer';

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
  const flat = productFlatParams(product, quantity);
  return {
    item_id: String(product?.id ?? product?.sku ?? 'unknown'),
    item_name: flat.product_name || 'Ürün',
    item_category: flat.category,
    item_brand: 'Nasyonel Toys',
    price: flat.price,
    quantity: flat.quantity,
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
 * GA4 ecommerce + düz ürün parametreleri ile event gönderir.
 */
function emitEcommerceEvent(
  eventName,
  { product, quantity, items, value, extra = {}, pathname } = {},
) {
  if (!canTrack(pathname)) return;

  const flat = product ? productFlatParams(product, quantity) : aggregateFlatParams(items || []);
  const gaItems = product
    ? [mapProductToGa4Item(product, quantity)]
    : mapCartItemsToGa4(items || []);

  const eventValue =
    value ??
    (product ? flat.price * flat.quantity : cartValue(items || []));

  gtag('event', eventName, {
    currency: GA4_CURRENCY,
    value: eventValue,
    items: gaItems,
    ...flat,
    ...getAttributionForEvents(),
    ...extra,
  });
}

export function trackPageView(params = {}) {
  const pathname = params.page_path || (typeof window !== 'undefined' ? window.location.pathname : '/');
  if (!canTrack(pathname)) return;

  gtag('event', 'page_view', {
    page_path: params.page_path || pathname,
    page_title: params.page_title || document.title,
    page_location: params.page_location || window.location.href,
    page_url: params.page_location || window.location.href,
  });
}

export function trackViewItem(product, pathname) {
  if (!product) return;
  emitEcommerceEvent('view_item', { product, quantity: 1, value: Number(product.price) || 0, pathname });
}

export function trackAddToCart(product, quantity = 1, pathname) {
  if (!product) return;
  emitEcommerceEvent('add_to_cart', { product, quantity, pathname });
}

export function trackRemoveFromCart(product, quantity = 1, pathname) {
  if (!product) return;
  emitEcommerceEvent('remove_from_cart', { product, quantity, pathname });
}

export function trackBeginCheckout(items, pathname) {
  if (!items?.length) return;
  emitEcommerceEvent('begin_checkout', { items, pathname });
}

export function trackPurchase({
  transactionId,
  items,
  value,
  shipping = 0,
  coupon = '',
  pathname,
}) {
  if (!transactionId || !items?.length) return;
  emitEcommerceEvent('purchase', {
    items,
    value,
    pathname,
    extra: {
      transaction_id: String(transactionId),
      shipping: Number(shipping) || 0,
      coupon: coupon || undefined,
    },
  });
}

function emitFormEvent(eventName, items, extra = {}, pathname) {
  if (!canTrack(pathname)) return;
  const flat = aggregateFlatParams(items || []);
  const gaItems = mapCartItemsToGa4(items || []);

  gtag('event', eventName, {
    currency: GA4_CURRENCY,
    value: flat.price,
    form_name: ORDER_FORM_NAME,
    items: gaItems,
    ...flat,
    ...extra,
  });
}

/** Müşteri sipariş formu görüntülendi */
export function trackFormView(items, pathname) {
  if (!items?.length) return;
  emitFormEvent('form_view', items, { form_step: 'customer_info' }, pathname);
}

/** Formda ilk etkileşim */
export function trackFormStart(items, pathname) {
  if (!items?.length) return;
  emitFormEvent('form_start', items, { form_step: 'customer_info' }, pathname);
}

/** Sipariş gönder butonuna basıldı */
export function trackFormSubmit(items, { success = false, errorMessage = '' } = {}, pathname) {
  if (!items?.length) return;
  emitFormEvent(
    'form_submit',
    items,
    {
      form_step: 'customer_info',
      success,
      error_message: errorMessage || undefined,
    },
    pathname,
  );
}

/** Başarılı sipariş / lead (WhatsApp) */
export function trackGenerateLead({ transactionId, items, value, pathname }) {
  if (!items?.length) return;
  emitFormEvent(
    'generate_lead',
    items,
    {
      transaction_id: transactionId ? String(transactionId) : undefined,
      lead_source: 'whatsapp_order',
      value: Number(value) || cartValue(items),
    },
    pathname,
  );
}
