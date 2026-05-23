const DEFAULT_LOGO = '/logo.svg';

/** Admin yüklemesi (data:), harici URL veya /public yolu — hepsi kullanılır */
export function resolveLogoUrl(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return DEFAULT_LOGO;
  return trimmed;
}

export { DEFAULT_LOGO };
