import { optimizeImageUrl } from '@/utils/imageOptimize';

/** Tam çözünürlük URL — detay sayfası galerisi için */
export function normalizeProductImageUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return url;
  return url.trim();
}

export function getDisplayImageUrl(url, variant = 'card') {
  const normalized = normalizeProductImageUrl(url);
  if (!normalized) return '';
  return optimizeImageUrl(normalized, variant);
}

/** Trendyol / katalog ürün görselleri — kırpma yok, orijinal oran (3:4) */
export const PRODUCT_MEDIA_FRAME =
  'product-media relative flex items-center justify-center overflow-hidden bg-white';

export const PRODUCT_MEDIA_IMG =
  'product-media-img h-full w-full object-contain';

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

export function getPrimaryImage(product, variant = 'card') {
  const images = getProductImages(product);
  const primary = images[0] || '';
  return primary ? getDisplayImageUrl(primary, variant) : '';
}
