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

/** Admin kaydı öncesi fiyat alanlarını yuvarlar */
export function normalizeProductPrices(product) {
  const price = Math.round((Number(product?.price) || 0) * 100) / 100;
  const rawCompare = Number(product?.compareAtPrice);
  const next = { ...product, price };
  if (Number.isFinite(rawCompare) && rawCompare > 0) {
    next.compareAtPrice = Math.round(rawCompare * 100) / 100;
  } else {
    delete next.compareAtPrice;
  }
  return next;
}

/** Ürün düzenleme — fiyat doğrulama */
export function validateProductPricing(form) {
  const errors = [];
  const warnings = [];
  const price = Number(form?.price);

  if (!Number.isFinite(price) || price <= 0) {
    errors.push('Satış fiyatı 0\'dan büyük olmalıdır.');
  }

  const rawCompare = Number(form?.compareAtPrice);
  if (Number.isFinite(rawCompare) && rawCompare > 0) {
    if (rawCompare <= price) {
      errors.push(
        'Liste fiyatı satış fiyatından büyük olmalıdır. “Kaçtan kaça” indirimi için eski fiyatı yükseltin.',
      );
    }
  } else if (Number.isFinite(price) && price > 0) {
    warnings.push(
      'Liste fiyatı girilmedi — sitede satış fiyatının 2 katı otomatik liste fiyatı olarak gösterilir.',
    );
  }

  return { errors, warnings, ok: errors.length === 0 };
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
