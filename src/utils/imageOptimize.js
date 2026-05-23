const VARIANTS = {
  card: { w: 400, h: 500 },
  thumb: { w: 160, h: 160 },
  square: { w: 400, h: 400 },
  detail: { w: 960, h: 1200 },
  banner: { w: 1280, h: 533 },
};

function isHttpUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
}

/** Unsplash / CDN URL'lerini görüntüleme bağlamına göre küçültür */
export function optimizeImageUrl(url, variant = 'card') {
  if (!isHttpUrl(url)) return url || '';
  const spec = VARIANTS[variant] || VARIANTS.card;
  const raw = url.trim();

  if (raw.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(raw);
      parsed.searchParams.set('w', String(spec.w));
      parsed.searchParams.set('q', variant === 'banner' ? '80' : '75');
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      return parsed.toString();
    } catch {
      return raw;
    }
  }

  if (/dsmcdn\.com|cdn\.dsmcdn/i.test(raw)) {
    if (/\/mnresize\/\d+\/\d+\//i.test(raw)) {
      return raw.replace(/\/mnresize\/\d+\/\d+\//i, `/mnresize/${spec.w}/${spec.h}/`);
    }
    return raw.replace(/(https?:\/\/[^/]+\/)(.+)/i, `$1mnresize/${spec.w}/${spec.h}/$2`);
  }

  try {
    const parsed = new URL(raw);
    if (!parsed.searchParams.has('w')) parsed.searchParams.set('w', String(spec.w));
    if (!parsed.searchParams.has('q')) parsed.searchParams.set('q', '80');
    return parsed.toString();
  } catch {
    return raw;
  }
}

export function optimizeBannerImage(url) {
  if (!url || typeof url !== 'string') return '';
  const raw = url.trim();
  // Yüklenen / CDN banner URL'lerine dokunma — yalnızca Unsplash demo görsellerini küçült
  if (raw.includes('images.unsplash.com')) return optimizeImageUrl(raw, 'banner');
  return raw;
}

export function buildImageSrcSet(url, variant = 'card') {
  if (!isHttpUrl(url)) return undefined;
  if (!url.includes('images.unsplash.com')) return undefined;
  const base = VARIANTS[variant] || VARIANTS.card;
  const widths = variant === 'detail' ? [400, 640, 960] : [200, 320, 480];
  return widths
    .map((w) => {
      const h = Math.round((base.h / base.w) * w);
      try {
        const parsed = new URL(url.trim());
        parsed.searchParams.set('w', String(w));
        parsed.searchParams.set('h', String(h));
        parsed.searchParams.set('q', '75');
        parsed.searchParams.set('auto', 'format');
        parsed.searchParams.set('fit', 'crop');
        return `${parsed.toString()} ${w}w`;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .join(', ');
}

export const IMAGE_SIZES = {
  card: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px',
  thumb: '96px',
  detail: '(max-width: 768px) 100vw, 560px',
  banner: '(max-width: 1280px) 100vw, 1280px',
};
