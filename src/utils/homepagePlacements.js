import { hasProductDiscount, getDiscountPercent } from '@/utils/productPricing';
import {
  getBestSellerProducts,
  filterEducationalProducts,
} from '@/utils/productBestseller';

export const HOMEPAGE_SECTIONS = [
  {
    id: 'bestsellers',
    label: 'En Çok Satanlar',
    limit: 16,
    hint: 'Ana sayfa ve /en-cok-satanlar. Sabitlediğiniz ürünler önce gösterilir; kalan yerler Trendyol satış sıralamasıyla dolar.',
  },
  {
    id: 'educational',
    label: 'Eğitici Oyuncaklar',
    limit: 12,
    hint: 'Montessori, zeka, puzzle vb. Sabit ürünlerden sonra otomatik eğitici ürünler eklenir.',
  },
  {
    id: 'deals',
    label: 'Flaş Fırsatlar',
    limit: 12,
    hint: 'İndirimli ürünler bandı. Sabitledikleriniz önce; kalanlar en yüksek indirim oranına göre dolar.',
  },
];

const EMPTY_SLOTS = {
  bestsellers: [],
  educational: [],
  deals: [],
};

export function normalizeHomepageSlots(slots) {
  if (!slots || typeof slots !== 'object') return { ...EMPTY_SLOTS };
  return {
    bestsellers: Array.isArray(slots.bestsellers) ? slots.bestsellers.map(String).filter(Boolean) : [],
    educational: Array.isArray(slots.educational) ? slots.educational.map(String).filter(Boolean) : [],
    deals: Array.isArray(slots.deals) ? slots.deals.map(String).filter(Boolean) : [],
  };
}

/** Sabit ID sırası + otomatik doldurma */
export function resolveSectionProducts(catalog, slotIds, fallbackFn, limit = 16) {
  const list = Array.isArray(catalog) ? catalog : [];
  const byId = new Map(list.filter((p) => p?.id).map((p) => [p.id, p]));
  const seen = new Set();
  const result = [];

  for (const id of slotIds || []) {
    const p = byId.get(id);
    if (!p || seen.has(p.id)) continue;
    seen.add(p.id);
    result.push(p);
  }

  if (result.length < limit) {
    const auto = fallbackFn(list) || [];
    for (const p of auto) {
      if (!p?.id || seen.has(p.id)) continue;
      seen.add(p.id);
      result.push(p);
      if (result.length >= limit) break;
    }
  }

  return result.slice(0, limit);
}

export function getDealProductsAuto(catalog, limit = 12) {
  return (Array.isArray(catalog) ? catalog : [])
    .filter((p) => hasProductDiscount(p))
    .sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))
    .slice(0, limit);
}

export function getEducationalProductsAuto(catalog, limit = 12) {
  const edu = filterEducationalProducts(catalog, limit);
  if (edu.length >= 4) return edu;
  return getBestSellerProducts(catalog, limit).filter((p) =>
    `${p.name} ${p.category}`.toLowerCase().match(/egitici|eğitici|zeka|puzzle|ahşap|montessori/i),
  );
}

export function resolveHomepageSection(catalog, slots, sectionId, limit) {
  const normalized = normalizeHomepageSlots(slots);
  const ids = normalized[sectionId] || [];

  if (sectionId === 'bestsellers') {
    return resolveSectionProducts(catalog, ids, (c) => getBestSellerProducts(c, limit), limit);
  }
  if (sectionId === 'educational') {
    return resolveSectionProducts(catalog, ids, (c) => getEducationalProductsAuto(c, limit), limit);
  }
  if (sectionId === 'deals') {
    return resolveSectionProducts(catalog, ids, (c) => getDealProductsAuto(c, limit), limit);
  }
  return [];
}

export function countPinnedInSection(slots, sectionId) {
  return (normalizeHomepageSlots(slots)[sectionId] || []).length;
}
