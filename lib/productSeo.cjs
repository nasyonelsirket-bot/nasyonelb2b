/**
 * Ürün SEO — sunucu tarafı (catalog-save, yayın)
 * src/utils/productSeo.js ile aynı kurallar
 */

const { rewriteUrlToCanonical } = require('./canonicalSiteUrl.cjs');

const META_TITLE_MAX = 60;
const META_DESCRIPTION_MAX = 160;

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

function slugifyProductName(text) {
  let s = String(text || '').trim();
  s = s.replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => TR_CHAR_MAP[ch] || ch);
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeSlug(value) {
  return slugifyProductName(String(value || '').replace(/\//g, '-'));
}

function stripHtml(text) {
  return String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeMetaTitle(value, fallback = '') {
  return stripHtml(value || fallback).slice(0, META_TITLE_MAX);
}

function sanitizeMetaDescription(value, fallback = '') {
  return stripHtml(value || fallback).slice(0, META_DESCRIPTION_MAX);
}

function sanitizeCanonicalUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return rewriteUrlToCanonical(raw);
  return rewriteUrlToCanonical(raw.startsWith('/') ? raw : `/${raw}`);
}

function isSlugTaken(products, slug, excludeId) {
  const normalized = normalizeSlug(slug);
  if (!normalized) return false;
  return products.some((p) => p && p.slug === normalized && p.id !== excludeId);
}

function ensureUniqueSlug(slug, products, excludeId) {
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

function normalizeProductSeoFields(product, allProducts, excludeId) {
  const name = String(product?.name || '').trim();
  const slugInput = String(product?.slug ?? '').trim();
  const slug = ensureUniqueSlug(
    slugInput || slugifyProductName(name) || `urun-${Date.now()}`,
    allProducts,
    excludeId ?? product?.id,
  );

  return {
    ...product,
    slug,
    meta_title: sanitizeMetaTitle(product?.meta_title, name),
    meta_description: sanitizeMetaDescription(
      product?.meta_description,
      product?.description || '',
    ),
    canonical_url: sanitizeCanonicalUrl(product?.canonical_url),
  };
}

function sanitizeProductsSeo(products) {
  const list = Array.isArray(products) ? products : [];
  return list.map((p) => normalizeProductSeoFields(p, list, p?.id));
}

module.exports = {
  META_TITLE_MAX,
  META_DESCRIPTION_MAX,
  slugifyProductName,
  normalizeSlug,
  sanitizeProductsSeo,
  normalizeProductSeoFields,
};
