const CATALOG_GET = '/api/catalog';
const CATALOG_SAVE = '/api/catalog/save';

export async function fetchPublishedCatalog() {
  try {
    const res = await fetch(CATALOG_GET, { method: 'GET', cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data?.products) || !data.products.length) return null;
    return data;
  } catch {
    return null;
  }
}

export async function publishCatalog({ products, categories, banners, settings, password }) {
  const res = await fetch(CATALOG_SAVE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      products,
      categories,
      banners,
      settings,
      password: String(password || '').trim(),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = [data.error, data.hint].filter(Boolean).join(' — ') || `Yayınlama başarısız (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

export function getAdminPasswordForPublish() {
  try {
    return sessionStorage.getItem('b2b_admin_pass') || '';
  } catch {
    return '';
  }
}

/** Yayınlama şifresi — oturum yoksa sorar */
export function askPublishPassword() {
  const fromSession = getAdminPasswordForPublish();
  if (fromSession) return fromSession;
  if (typeof window === 'undefined') return '';
  return window.prompt('Siteye yayınlamak için admin şifrenizi girin:')?.trim() || '';
}
