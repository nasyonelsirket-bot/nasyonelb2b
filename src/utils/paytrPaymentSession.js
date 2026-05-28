const STORAGE_PREFIX = 'paytr_pay_';
const LAST_ORDER_KEY = 'paytr_last_order';
const PURCHASE_ANALYTICS_PREFIX = 'purchase_analytics_';
const memoryCache = new Map();
const inflightPromises = new Map();

function storageKey(orderId) {
  return `${STORAGE_PREFIX}${orderId}`;
}

export function persistPaymentNavState({ orderId, orderNumber, orderTotal }) {
  if (!orderId) return;
  const payload = {
    orderId,
    orderNumber: orderNumber ?? null,
    orderTotal: orderTotal ?? null,
    savedAt: Date.now(),
  };
  memoryCache.set(`nav:${orderId}`, payload);
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
}

export function resolvePaymentNavState(locationState) {
  if (locationState?.orderId) {
    persistPaymentNavState(locationState);
    return locationState;
  }

  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.orderId) return parsed;
    }
  } catch {
    /* ignore */
  }

  return null;
}

export function readPaymentSession(orderId) {
  const mem = memoryCache.get(orderId);
  if (mem?.iframeUrl) return mem;

  try {
    const raw = sessionStorage.getItem(storageKey(orderId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.iframeUrl) {
        memoryCache.set(orderId, parsed);
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}

function writePaymentSession(orderId, data) {
  const payload = {
    ...data,
    orderId,
    updatedAt: Date.now(),
  };
  memoryCache.set(orderId, payload);
  try {
    sessionStorage.setItem(storageKey(orderId), JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

/** Aynı sipariş için tek iframe token isteği — remount / OTP autofill sonrası yeniden oluşturmaz. */
export async function ensurePaytrIframeSession(orderId, fetchFn) {
  const cached = readPaymentSession(orderId);
  if (cached?.iframeUrl && cached?.iframeToken) {
    return cached;
  }

  if (inflightPromises.has(orderId)) {
    return inflightPromises.get(orderId);
  }

  const promise = fetchFn()
    .then((data) => {
      writePaymentSession(orderId, data);
      return data;
    })
    .finally(() => {
      inflightPromises.delete(orderId);
    });

  inflightPromises.set(orderId, promise);
  return promise;
}

export function clearPaymentSession(orderId) {
  if (orderId) {
    memoryCache.delete(orderId);
    memoryCache.delete(`nav:${orderId}`);
    try {
      sessionStorage.removeItem(storageKey(orderId));
      sessionStorage.removeItem(`${PURCHASE_ANALYTICS_PREFIX}${orderId}`);
    } catch {
      /* ignore */
    }
  }
  try {
    sessionStorage.removeItem(LAST_ORDER_KEY);
  } catch {
    /* ignore */
  }
}

/** Purchase pixel yedek verisi — sepet temizlense bile thank-you sayfasında kullanılır */
export function persistPurchaseAnalytics(orderId, payload) {
  if (!orderId || !payload) return;
  try {
    sessionStorage.setItem(
      `${PURCHASE_ANALYTICS_PREFIX}${orderId}`,
      JSON.stringify({
        ...payload,
        savedAt: Date.now(),
      }),
    );
  } catch {
    /* private mode */
  }
}

export function readPurchaseAnalytics(orderId) {
  if (!orderId) return null;
  try {
    const raw = sessionStorage.getItem(`${PURCHASE_ANALYTICS_PREFIX}${orderId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
