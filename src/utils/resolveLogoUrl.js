const DEFAULT_LOGO = '/nasyonel-logo.svg?v=1';

/** Admin yüklemesi (data:), harici URL veya /public yolu — hepsi kullanılır */
export function resolveLogoUrl(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return DEFAULT_LOGO;
  if (trimmed === '/logo.svg' || trimmed.endsWith('/logo.svg')) return DEFAULT_LOGO;
  if (trimmed.includes('nasyonel-logo.png')) return DEFAULT_LOGO;
  return trimmed;
}

export { DEFAULT_LOGO };
