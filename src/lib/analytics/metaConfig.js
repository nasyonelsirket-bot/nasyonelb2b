/** Varsayılan Meta Pixel ID — admin veya env ile geçersiz kılınabilir */
export const META_PIXEL_ID_DEFAULT = '961867176690620';

export const META_CURRENCY = 'TRY';

export function resolveMetaPixelId(settingsPixelId) {
  const fromEnv = String(import.meta.env.VITE_META_PIXEL_ID || '').trim();
  if (fromEnv) return fromEnv;

  const fromSettings = String(settingsPixelId || '').trim();
  if (fromSettings) return fromSettings;

  return META_PIXEL_ID_DEFAULT;
}

export function isMetaTrackablePath(pathname = '') {
  return Boolean(pathname && !pathname.startsWith('/admin'));
}
