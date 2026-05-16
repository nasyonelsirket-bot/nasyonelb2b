/** Trendyol CDN küçük ölçü parametrelerini kaldırır (görsel dosyası yeniden işlenmez). */
export function normalizeProductImageUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return url;

  let u = url.trim();
  u = u.replace(/\/mnresize\/\d+\/\d+\//gi, '/');
  u = u.replace(/\/mnresize\/\d+\/-\//gi, '/');
  u = u.replace(/\/(\d{2,4})x(\d{2,4})\//gi, '/');

  try {
    const parsed = new URL(u);
    ['width', 'height', 'w', 'h', 'size', 'thumbnail'].forEach((k) => parsed.searchParams.delete(k));
    return parsed.toString();
  } catch {
    return u;
  }
}

/** Trendyol / katalog ürün görselleri — kırpma yok, orijinal oran (3:4) */
export const PRODUCT_MEDIA_FRAME =
  'product-media relative flex items-center justify-center overflow-hidden bg-white';

export const PRODUCT_MEDIA_IMG =
  'product-media-img max-h-full max-w-full h-auto w-auto object-contain';

export function getProductImages(product) {
  const list = [];
  if (Array.isArray(product?.images)) {
    product.images.forEach((u) => {
      if (u && typeof u === 'string') list.push(normalizeProductImageUrl(u));
    });
  }
  if (product?.image) {
    const main = normalizeProductImageUrl(product.image);
    if (main && !list.includes(main)) list.unshift(main);
  }
  return [...new Set(list.filter(Boolean))];
}

export function getPrimaryImage(product) {
  const images = getProductImages(product);
  return images[0] || '';
}
