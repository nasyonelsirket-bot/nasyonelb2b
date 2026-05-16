/** GA4 ecommerce + özel parametreler (Realtime / Ecommerce raporları) */

export function getPageUrl() {
  if (typeof window === 'undefined') return '';
  return window.location.href;
}

export function productFlatParams(product, quantity = 1) {
  const price = Number(product?.price) || 0;
  const qty = Math.max(1, Number(quantity) || 1);
  return {
    product_name: String(product?.name ?? ''),
    category: String(product?.category ?? ''),
    price,
    quantity: qty,
    page_url: getPageUrl(),
  };
}

export function aggregateFlatParams(items = []) {
  if (!items.length) {
    return {
      product_name: '',
      category: '',
      price: 0,
      quantity: 0,
      page_url: getPageUrl(),
    };
  }

  const names = items.map((i) => i.name).filter(Boolean);
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];
  const quantity = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const price = items.reduce(
    (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0),
    0,
  );

  return {
    product_name: names.join(' | '),
    category: categories.join(' | '),
    price,
    quantity,
    page_url: getPageUrl(),
  };
}
