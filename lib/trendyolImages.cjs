/**
 * Trendyol CDN görsellerinde küçük ölçü parametrelerini kaldırır,
 * mümkün olan en yüksek çözünürlüklü URL'yi seçer (sunucuda yeniden boyutlandırma yok).
 */

function estimateImagePixels(url) {
  if (!url || typeof url !== 'string') return 0;

  const mn = url.match(/\/mnresize\/(\d+)\/(\d+|-)\//i);
  if (mn) {
    const w = Number(mn[1]) || 0;
    const h = mn[2] === '-' ? w : Number(mn[2]) || w;
    return w * h;
  }

  const boxed = url.match(/\/(\d{3,4})x(\d{3,4})\//i);
  if (boxed) return Number(boxed[1]) * Number(boxed[2]);

  try {
    const parsed = new URL(url);
    const w = Number(parsed.searchParams.get('width') || parsed.searchParams.get('w') || 0);
    const h = Number(parsed.searchParams.get('height') || parsed.searchParams.get('h') || 0);
    if (w && h) return w * h;
    if (w) return w * w;
  } catch {
    /* ignore */
  }

  if (!/\/mnresize\/|\d{2,4}x\d{2,4}/i.test(url)) return 1e9;
  return 100;
}

function normalizeTrendyolImageUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return url;

  let u = url.trim();
  u = u.replace(/\/mnresize\/\d+\/\d+\//gi, '/');
  u = u.replace(/\/mnresize\/\d+\/-\//gi, '/');
  u = u.replace(/\/(\d{2,4})x(\d{2,4})\//gi, '/');

  try {
    const parsed = new URL(u);
    ['width', 'height', 'w', 'h', 'size', 'thumbnail'].forEach((k) => parsed.searchParams.delete(k));
    u = parsed.toString();
  } catch {
    /* keep u */
  }

  return u;
}

function pickBestProductImage(urls) {
  const raw = [...new Set((urls || []).filter((u) => u && typeof u === 'string' && u.startsWith('http')))];
  if (!raw.length) return '';

  const best = raw.sort((a, b) => estimateImagePixels(b) - estimateImagePixels(a))[0];
  return normalizeTrendyolImageUrl(best);
}

function sortImagesLargestFirst(urls) {
  const raw = [...new Set((urls || []).filter((u) => u && typeof u === 'string' && u.startsWith('http')))];
  return raw
    .sort((a, b) => estimateImagePixels(b) - estimateImagePixels(a))
    .map(normalizeTrendyolImageUrl)
    .filter((u, i, arr) => arr.indexOf(u) === i);
}

module.exports = {
  normalizeTrendyolImageUrl,
  pickBestProductImage,
  sortImagesLargestFirst,
  estimateImagePixels,
};
