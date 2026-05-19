/** Ürün SEO alanları — slug, meta title/description, canonical */

export const META_TITLE_MAX = 60;
export const META_DESCRIPTION_MAX = 160;

const TR_CHAR_MAP = {
  ç: 'c',
  Ç: 'c',
  ğ: 'g',
  Ğ: 'g',
  ı: 'i',
  İ: 'i',
  I: 'i',
  ö: 'o',
  Ö: 'o',
  ş: 's',
  Ş: 's',
  ü: 'u',
  Ü: 'u',
};

/** "Ahşap Çalışma Masası" → ahsap-calisma-masasi */
export function slugifyProductName(text) {
  let s = String(text || '').trim();
  s = s.replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => TR_CHAR_MAP[ch] || ch);
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function normalizeSlug(value) {
  return slugifyProductName(String(value || '').replace(/\//g, '-'));
}

export function stripHtml(text) {
  return String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeMetaTitle(value, fallback = '') {
  const raw = stripHtml(value || fallback);
  return raw.slice(0, META_TITLE_MAX);
}

export function sanitizeMetaDescription(value, fallback = '') {
  const raw = stripHtml(value || fallback);
  return raw.slice(0, META_DESCRIPTION_MAX);
}

export function sanitizeCanonicalUrl(value, siteUrl, productPath) {
  const raw = String(value || '').trim();
  if (!raw) {
    const base = String(siteUrl || '').replace(/\/$/, '');
    return base ? `${base}${productPath}` : productPath;
  }
  if (/^https?:\/\//i.test(raw)) return raw.slice(0, 512);
  const base = String(siteUrl || '').replace(/\/$/, '');
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return base ? `${base}${path}`.slice(0, 512) : path.slice(0, 512);
}

export function getProductPath(product) {
  const slug = normalizeSlug(product?.slug);
  const id = product?.id;
  return `/urun/${slug || id || ''}`;
}

export function getProductLink(product) {
  return getProductPath(product);
}

export function findProductBySlug(products, slug, excludeId = null) {
  const normalized = normalizeSlug(slug);
  if (!normalized) return null;
  return (Array.isArray(products) ? products : []).find(
    (p) => p.slug === normalized && p.id !== excludeId,
  );
}

export function isSlugTaken(products, slug, excludeId = null) {
  return Boolean(findProductBySlug(products, slug, excludeId));
}

/** Çakışmada -2, -3 … ekler */
export function ensureUniqueSlug(slug, products, excludeId = null) {
  const base = normalizeSlug(slug);
  if (!base) return '';
  let candidate = base;
  let n = 2;
  while (isSlugTaken(products, candidate, excludeId)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}

export function getProductMetaTitle(product, siteName = 'Nasyonel Toys') {
  const custom = String(product?.meta_title || '').trim();
  if (custom) return sanitizeMetaTitle(custom);
  const name = String(product?.name || '').trim();
  if (!name) return siteName;
  const withBrand = `${name} | ${siteName}`;
  return withBrand.length <= META_TITLE_MAX
    ? withBrand
    : sanitizeMetaTitle(name);
}

export function getProductMetaDescription(product, settings = {}) {
  const custom = String(product?.meta_description || '').trim();
  if (custom) return sanitizeMetaDescription(custom);
  const desc = String(product?.description || settings?.tagline || '').trim();
  return sanitizeMetaDescription(desc);
}

export function getProductCanonical(product, siteUrl) {
  const custom = String(product?.canonical_url || '').trim();
  const path = getProductPath(product);
  return sanitizeCanonicalUrl(custom, siteUrl, path);
}

/** Form / API kaydı öncesi ürün SEO alanlarını normalize eder */
export function normalizeProductSeoFields(product, allProducts = [], excludeId = null) {
  const name = String(product?.name || '').trim();
  const slugInput = String(product?.slug ?? '').trim();
  const slug = ensureUniqueSlug(
    slugInput || slugifyProductName(name) || `urun-${Date.now()}`,
    allProducts,
    excludeId ?? product?.id,
  );

  const path = `/urun/${slug}`;
  const siteUrl = ''; // canonical tam URL publish sırasında settings ile tamamlanır

  return {
    ...product,
    slug,
    meta_title: sanitizeMetaTitle(product?.meta_title, name),
    meta_description: sanitizeMetaDescription(
      product?.meta_description,
      product?.description || '',
    ),
    canonical_url: product?.canonical_url
      ? sanitizeCanonicalUrl(product.canonical_url, '', path)
      : '',
  };
}

export function validateProductSeoForm(form, products, excludeId = null) {
  const errors = [];
  const warnings = [];

  const slug = normalizeSlug(form?.slug);
  if (!slug && !String(form?.name || '').trim()) {
    errors.push('SEO URL için ürün adı veya slug gerekli.');
  }

  if (slug && isSlugTaken(products, slug, excludeId)) {
    const other = findProductBySlug(products, slug, excludeId);
    warnings.push(
      `Bu SEO URL başka bir üründe kullanılıyor${other?.name ? `: “${other.name}”` : ''}. Kayıtta otomatik benzersiz yapılacak.`,
    );
  }

  const titleLen = String(form?.meta_title || '').trim().length;
  if (titleLen > META_TITLE_MAX) {
    warnings.push(`Meta title ${META_TITLE_MAX} karakteri aşıyor (${titleLen}).`);
  }

  const descLen = String(form?.meta_description || '').trim().length;
  if (descLen > META_DESCRIPTION_MAX) {
    warnings.push(`Meta description ${META_DESCRIPTION_MAX} karakteri aşıyor (${descLen}).`);
  }

  const canonical = String(form?.canonical_url || '').trim();
  if (canonical && !/^https?:\/\//i.test(canonical) && !canonical.startsWith('/')) {
    warnings.push('Canonical URL http(s):// veya / ile başlamalı.');
  }

  return { errors, warnings, ok: errors.length === 0 };
}

/** Mevcut katalogdaki ürünlere slug yoksa ekler */
export function migrateProductsSeo(products) {
  const list = Array.isArray(products) ? [...products] : [];
  const used = new Set();
  return list.map((p) => {
    let slug = normalizeSlug(p.slug) || slugifyProductName(p.name) || normalizeSlug(p.id);
    while (used.has(slug)) {
      slug = `${slug}-${used.size + 1}`;
    }
    used.add(slug);
    return normalizeProductSeoFields({ ...p, slug }, list, p.id);
  });
}
