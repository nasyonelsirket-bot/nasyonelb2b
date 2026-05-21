/** Liste fiyatı (üstü çizili) — compareAtPrice veya satış fiyatının 2 katı */
export function getCompareAtPrice(product) {
  const compare = Number(product?.compareAtPrice);
  if (Number.isFinite(compare) && compare > 0) return compare;
  const price = Number(product?.price) || 0;
  if (price <= 0) return 0;
  return Math.round(price * 2 * 100) / 100;
}

export function getDiscountPercent(product) {
  const compare = getCompareAtPrice(product);
  const price = Number(product?.price) || 0;
  if (compare <= price || compare <= 0) return 0;
  return Math.round((1 - price / compare) * 100);
}

export function hasProductDiscount(product) {
  return getDiscountPercent(product) >= 5;
}

/** Trendyol / manuel ürün: satış + liste fiyatı */
export function applyRetailPricing(product, priceDivisor = 2) {
  const divisor = Math.max(1, Number(priceDivisor) || 2);
  const raw = Number(product?.compareAtPrice ?? product?.listPrice ?? product?.price) || 0;
  if (raw <= 0) return product;
  const compareAtPrice = Math.round(raw * 100) / 100;
  const price = Math.round((compareAtPrice / divisor) * 100) / 100;
  return {
    ...product,
    compareAtPrice,
    price,
    isCampaign: product.isCampaign !== false,
  };
}
