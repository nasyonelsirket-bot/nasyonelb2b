import { optimizeBannerImage } from '@/utils/imageOptimize';

/**
 * Banner görsel URL — CDN/cache kırma.
 * Mobilde ve masaüstünde aynı parametre; tarayıcı önbelleğini günceller.
 */
export function bannerImageUrl(image, bustToken) {
  if (!image || typeof image !== 'string') return '';
  const raw = image.trim();
  if (!raw) return '';

  const optimized = optimizeBannerImage(raw);
  if (raw.startsWith('data:')) return raw;

  const token = bustToken != null ? String(bustToken) : String(Date.now());
  const sep = optimized.includes('?') ? '&' : '?';
  return `${optimized}${sep}v=${encodeURIComponent(token)}`;
}
