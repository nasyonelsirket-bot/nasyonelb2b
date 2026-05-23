import { hasProductDiscount, getDiscountPercent } from '@/utils/productPricing';
import {
  getBestSellerProducts,
  filterEducationalProducts,
} from '@/utils/productBestseller';

export const HOMEPAGE_SECTION_IDS = ['bestsellers', 'newArrivals', 'deals', 'educational', 'trust', 'allProducts'];

export const HOMEPAGE_SECTIONS = [
  {
    id: 'bestsellers',
    label: 'Çok Satanlar',
    type: 'strip',
    limit: 24,
    hashId: 'cok-satanlar',
    hint: 'Yatay ürün bandı. Ürün seçmezseniz otomatik doldurulur (açıksa).',
  },
  {
    id: 'newArrivals',
    label: 'Yeni Gelenler',
    type: 'strip',
    limit: 24,
    hashId: 'yeni-gelenler',
    hint: 'Yeni ürünler bandı.',
  },
  {
    id: 'deals',
    label: 'Trend Ürünler',
    type: 'strip',
    limit: 24,
    hashId: 'firsatlar',
    hint: 'İndirimli / trend ürünler bandı.',
  },
  {
    id: 'educational',
    label: 'Eğitici Oyuncaklar',
    type: 'strip',
    limit: 24,
    hashId: 'egitici',
    hint: 'Eğitici kategorideki ürünler veya seçtiğiniz liste.',
  },
  {
    id: 'trust',
    label: 'Güven Alanı',
    type: 'trust',
    hashId: 'guven',
    hint: 'SSL, kargo, müşteri memnuniyeti rozetleri.',
  },
  {
    id: 'allProducts',
    label: 'Tüm Ürünler',
    type: 'grid',
    hashId: 'urunler',
    hint: 'Ana sayfa altındaki tam ürün listesi ve sıralama.',
  },
];

const DEFAULT_SECTION_ORDER = ['bestsellers', 'newArrivals', 'deals', 'educational', 'allProducts'];

const DEFAULT_SECTIONS = {
  bestsellers: {
    enabled: true,
    title: 'Çok Satanlar',
    subtitle: 'Müşterilerimizin en çok tercih ettiği ürünler',
    badge: 'Popüler',
    seeAllHref: '/en-cok-satanlar',
    seeAllLabel: 'Tümünü Gör',
    accent: 'orange',
    limit: 16,
    autoFill: true,
    productIds: [],
  },
  newArrivals: {
    enabled: true,
    title: 'Yeni Gelenler',
    subtitle: 'Koleksiyonumuza yeni eklenen ürünler',
    badge: 'Yeni',
    seeAllHref: '/#yeni-gelenler',
    seeAllLabel: 'Tümünü Gör',
    accent: 'brand',
    limit: 12,
    autoFill: true,
    productIds: [],
  },
  educational: {
    enabled: true,
    title: 'Eğitici Oyuncaklar',
    subtitle: 'Montessori, zeka ve öğrenme oyuncakları',
    badge: '',
    seeAllHref: '/kategoriler?cat=Eğitici%20Oyuncaklar',
    seeAllLabel: 'Tümünü Gör',
    accent: 'brand',
    limit: 12,
    autoFill: true,
    productIds: [],
  },
  deals: {
    enabled: true,
    title: 'Trend Ürünler',
    subtitle: 'En yüksek indirimli ve popüler fırsatlar',
    badge: 'İndirim',
    seeAllHref: '/#firsatlar',
    seeAllLabel: 'Tümünü Gör',
    accent: 'orange',
    limit: 12,
    autoFill: true,
    productIds: [],
  },
  trust: {
    enabled: true,
  },
  allProducts: {
    enabled: true,
    title: 'Tüm Ürünler',
    subtitle: '',
    showSort: true,
  },
};

const EMPTY_SLOTS = {
  bestsellers: [],
  newArrivals: [],
  educational: [],
  deals: [],
};

export function isBannerSectionId(sectionId) {
  return typeof sectionId === 'string' && sectionId.startsWith('banner-');
}

export function createBannerSectionId() {
  return `banner-${Date.now()}`;
}

export function getSectionDisplayLabel(sectionId, sections = {}) {
  if (sectionId === 'trust') return 'Güven Alanı';
  if (isBannerSectionId(sectionId)) {
    const cfg = sections[sectionId];
    const custom = String(cfg?.label || '').trim();
    if (custom) return custom;
    const count = (cfg?.bannerIds || []).length;
    return count > 0 ? `Banner alanı (${count} görsel)` : 'Banner alanı';
  }
  return HOMEPAGE_SECTIONS.find((s) => s.id === sectionId)?.label || sectionId;
}

function normalizeBannerSection(from = {}) {
  return {
    type: 'banner',
    enabled: from.enabled !== false,
    label: String(from.label || '').trim(),
    bannerIds: Array.isArray(from.bannerIds) ? from.bannerIds.map(String).filter(Boolean) : [],
  };
}

/** @deprecated — homepageLayout.sections[id].productIds kullanın */
export function normalizeHomepageSlots(slots) {
  if (!slots || typeof slots !== 'object') return { ...EMPTY_SLOTS };
  return {
    bestsellers: Array.isArray(slots.bestsellers) ? slots.bestsellers.map(String).filter(Boolean) : [],
    newArrivals: Array.isArray(slots.newArrivals) ? slots.newArrivals.map(String).filter(Boolean) : [],
    educational: Array.isArray(slots.educational) ? slots.educational.map(String).filter(Boolean) : [],
    deals: Array.isArray(slots.deals) ? slots.deals.map(String).filter(Boolean) : [],
  };
}

function normalizeStripSection(id, from = {}, legacyIds = []) {
  const def = DEFAULT_SECTIONS[id];
  const productIds = Array.isArray(from.productIds)
    ? from.productIds.map(String).filter(Boolean)
    : legacyIds;
  return {
    ...def,
    enabled: from.enabled !== false,
    title: String(from.title ?? def.title).trim() || def.title,
    subtitle: String(from.subtitle ?? def.subtitle ?? '').trim(),
    badge: String(from.badge ?? def.badge ?? '').trim(),
    seeAllHref: String(from.seeAllHref ?? def.seeAllHref).trim() || def.seeAllHref,
    seeAllLabel: String(from.seeAllLabel ?? def.seeAllLabel).trim() || def.seeAllLabel,
    accent: from.accent === 'brand' ? 'brand' : 'orange',
    limit: Math.min(48, Math.max(1, Number(from.limit) || def.limit)),
    autoFill: from.autoFill !== false,
    productIds,
  };
}

function isValidOrderId(id) {
  return HOMEPAGE_SECTION_IDS.includes(id) || isBannerSectionId(id);
}

/** settings.homepageLayout + eski homepageSlots birleşimi */
export function normalizeHomepageLayout(settings) {
  const legacySlots = normalizeHomepageSlots(settings?.homepageSlots);
  const raw = settings?.homepageLayout;

  const sections = {
    bestsellers: normalizeStripSection('bestsellers', raw?.sections?.bestsellers, legacySlots.bestsellers),
    newArrivals: normalizeStripSection('newArrivals', raw?.sections?.newArrivals, legacySlots.newArrivals),
    educational: normalizeStripSection('educational', raw?.sections?.educational, legacySlots.educational),
    deals: normalizeStripSection('deals', raw?.sections?.deals, legacySlots.deals),
    trust: {
      ...DEFAULT_SECTIONS.trust,
      ...(raw?.sections?.trust || {}),
      enabled: raw?.sections?.trust?.enabled !== false,
    },
    allProducts: {
      ...DEFAULT_SECTIONS.allProducts,
      ...(raw?.sections?.allProducts || {}),
      enabled: raw?.sections?.allProducts?.enabled !== false,
      title: String(raw?.sections?.allProducts?.title ?? DEFAULT_SECTIONS.allProducts.title).trim()
        || DEFAULT_SECTIONS.allProducts.title,
      subtitle: String(raw?.sections?.allProducts?.subtitle ?? '').trim(),
      showSort: raw?.sections?.allProducts?.showSort !== false,
    },
  };

  if (raw?.sections && typeof raw.sections === 'object') {
    for (const [key, val] of Object.entries(raw.sections)) {
      if (isBannerSectionId(key)) {
        sections[key] = normalizeBannerSection(val);
      }
    }
  }

  let order = Array.isArray(raw?.order)
    ? raw.order.filter((id) => isValidOrderId(id))
    : [...DEFAULT_SECTION_ORDER];

  if (!order.length) order = [...DEFAULT_SECTION_ORDER];

  return { order, sections };
}

export function layoutToHomepageSlots(layout) {
  const { sections } = layout;
  return {
    bestsellers: sections.bestsellers?.productIds || [],
    newArrivals: sections.newArrivals?.productIds || [],
    educational: sections.educational?.productIds || [],
    deals: sections.deals?.productIds || [],
  };
}

export function layoutToHomepageLayoutPayload(layout) {
  const normalized = normalizeHomepageLayout({ homepageLayout: layout });
  return {
    order: normalized.order,
    sections: normalized.sections,
  };
}

function resolveManualProducts(catalog, slotIds, limit) {
  const list = Array.isArray(catalog) ? catalog : [];
  const byId = new Map(list.filter((p) => p?.id).map((p) => [p.id, p]));
  const result = [];
  for (const id of slotIds || []) {
    const p = byId.get(id);
    if (p) result.push(p);
    if (result.length >= limit) break;
  }
  return result;
}

/** Sabit ID sırası + isteğe bağlı otomatik doldurma */
export function resolveSectionProducts(catalog, slotIds, fallbackFn, limit = 16, autoFill = true) {
  if (!autoFill) {
    return resolveManualProducts(catalog, slotIds, limit);
  }

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

export function getNewArrivalProductsAuto(catalog, limit = 12) {
  const list = Array.isArray(catalog) ? catalog : [];
  const fresh = list.filter((p) => p.isNew);
  if (fresh.length >= 4) return fresh.slice(0, limit);
  return list.slice(-limit).reverse();
}

export function getEducationalProductsAuto(catalog, limit = 12) {
  const edu = filterEducationalProducts(catalog, limit);
  if (edu.length >= 4) return edu;
  return getBestSellerProducts(catalog, limit).filter((p) =>
    `${p.name} ${p.category}`.toLowerCase().match(/egitici|eğitici|zeka|puzzle|ahşap|montessori/i),
  );
}

export function resolveHomepageSection(catalog, settingsOrLayout, sectionId, limitOverride) {
  if (isBannerSectionId(sectionId)) return [];

  const layout = settingsOrLayout?.sections
    ? normalizeHomepageLayout({ homepageLayout: settingsOrLayout })
    : normalizeHomepageLayout(settingsOrLayout);
  const cfg = layout.sections[sectionId];
  if (!cfg || cfg.enabled === false) return [];

  const limit = limitOverride ?? cfg.limit ?? 16;
  const ids = cfg.productIds || [];
  const autoFill = cfg.autoFill !== false;

  if (sectionId === 'bestsellers') {
    return resolveSectionProducts(
      catalog,
      ids,
      (c) => getBestSellerProducts(c, limit),
      limit,
      autoFill,
    );
  }
  if (sectionId === 'newArrivals') {
    return resolveSectionProducts(
      catalog,
      ids,
      (c) => getNewArrivalProductsAuto(c, limit),
      limit,
      autoFill,
    );
  }
  if (sectionId === 'educational') {
    return resolveSectionProducts(
      catalog,
      ids,
      (c) => getEducationalProductsAuto(c, limit),
      limit,
      autoFill,
    );
  }
  if (sectionId === 'deals') {
    return resolveSectionProducts(
      catalog,
      ids,
      (c) => getDealProductsAuto(c, limit),
      limit,
      autoFill,
    );
  }
  return [];
}

export function countPinnedInSection(layoutOrSettings, sectionId) {
  const layout = layoutOrSettings?.sections
    ? normalizeHomepageLayout({ homepageLayout: layoutOrSettings })
    : normalizeHomepageLayout(layoutOrSettings);
  return (layout.sections[sectionId]?.productIds || []).length;
}

export function getSectionHashId(sectionId) {
  if (isBannerSectionId(sectionId)) return sectionId;
  return HOMEPAGE_SECTIONS.find((s) => s.id === sectionId)?.hashId || sectionId;
}
