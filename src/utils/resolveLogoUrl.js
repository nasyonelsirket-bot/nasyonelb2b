const DEFAULT_LOGO = '/nasyonel-logo.png?v=3';

/** Admin yüklemesi (data:), harici URL veya /public yolu — hepsi kullanılır */
export function resolveLogoUrl(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return DEFAULT_LOGO;
  if (trimmed === '/logo.svg' || trimmed.endsWith('/logo.svg')) return DEFAULT_LOGO;
  if (trimmed.includes('nasyonel-logo.svg')) return DEFAULT_LOGO;
  return trimmed;
}

export { DEFAULT_LOGO };
