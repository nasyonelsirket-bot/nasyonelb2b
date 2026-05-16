/** Varsayılan GA4 Measurement ID — admin veya env ile geçersiz kılınabilir */
export const GA4_MEASUREMENT_ID_DEFAULT = 'G-5SLP8QB6P1';

export const GA4_CURRENCY = 'TRY';

export function resolveMeasurementId(settingsGaId) {
  const fromEnv =
    import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ||
    import.meta.env.VITE_GA_ID?.trim() ||
    '';
  if (fromEnv) return fromEnv;

  const fromSettings = String(settingsGaId || '').trim();
  if (fromSettings) return fromSettings;

  return GA4_MEASUREMENT_ID_DEFAULT;
}

export function isGa4TrackablePath(pathname = '') {
  return pathname && !pathname.startsWith('/admin');
}
