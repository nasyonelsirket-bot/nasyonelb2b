const DEFAULT_LOGO = '/nasyonel-logo.png?v=5';

/** Header’da resmi marka logosu — admin’deki küçük/eksik URL’leri yoksay */
export function resolveHeaderLogoUrl(url) {
  const trimmed = String(url || '').trim();
  if (trimmed.startsWith('data:') && trimmed.length > 5000) return trimmed;
  return DEFAULT_LOGO;
}

/** Admin yüklemesi (data:), harici URL veya /public yolu — footer vb. için */
export function resolveLogoUrl(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return DEFAULT_LOGO;
  if (trimmed === '/logo.svg' || trimmed.endsWith('/logo.svg')) return DEFAULT_LOGO;
  if (trimmed.includes('nasyonel-logo.svg')) return DEFAULT_LOGO;
  if (trimmed.includes('nasyonel-logo.png') && !trimmed.includes('v=5')) return DEFAULT_LOGO;
  return trimmed;
}

export { DEFAULT_LOGO };
