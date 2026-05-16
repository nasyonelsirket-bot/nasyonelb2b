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
      password,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Yayınlama başarısız (${res.status})`);
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
