/** Meta Purchase deduplication — aynı sipariş için tek event */

const STORAGE_PREFIX = 'meta_purchase_tracked_';

export function purchaseEventId(orderId) {
  const id = String(orderId || '').trim();
  if (!id) return null;
  return `purchase_${id}`;
}

export function hasMetaPurchaseTracked(orderId) {
  if (typeof window === 'undefined' || !orderId) return false;
  try {
    return sessionStorage.getItem(`${STORAGE_PREFIX}${orderId}`) === '1';
  } catch {
    return false;
  }
}

export function markMetaPurchaseTracked(orderId, eventId) {
  if (typeof window === 'undefined' || !orderId) return;
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${orderId}`, '1');
    if (eventId) {
      sessionStorage.setItem(`${STORAGE_PREFIX}${orderId}_event`, String(eventId));
    }
  } catch {
    /* private mode */
  }
}

export function mapOrderItemsForMeta(items = []) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    id: item.id ?? item.sku ?? item.productId,
    sku: item.sku,
    name: item.name,
    price: Number(item.price) || 0,
    quantity: Math.max(1, Number(item.quantity) || 1),
    image: item.image,
  }));
}
