import { KEYS, saveToStorage, loadArrayFromStorage } from '@/utils/storage';

const SESSION_BANNER_KEY = 'b2b_banners';

/** Aktif / silinen banner listelerini admin konsoluna yazar */
export function logBannerState(label, banners, settings) {
  if (typeof console === 'undefined') return;
  const list = Array.isArray(banners) ? banners : [];
  const active = list.filter((b) => b.active !== false && b.image);
  const inactive = list.filter((b) => b.active === false || !b.image);
  const layout = settings?.homepageLayout;
  const slots = [];

  if (layout?.sections && typeof layout.sections === 'object') {
    for (const [sectionId, cfg] of Object.entries(layout.sections)) {
      if (!sectionId.startsWith('banner-')) continue;
      slots.push({
        sectionId,
        orderIndex: Array.isArray(layout.order) ? layout.order.indexOf(sectionId) : -1,
        bannerIds: cfg?.bannerIds || [],
      });
    }
  }

  console.log(`[Banner] ${label}`, {
    total: list.length,
    active: active.map((b) => ({ id: b.id, title: b.title || '(başlıksız)', updatedAt: b.updatedAt })),
    inactive: inactive.map((b) => ({ id: b.id, title: b.title || '(başlıksız)' })),
    layoutSlots: slots,
  });
}

/** localStorage + sessionStorage + DOM preload link temizliği */
export function clearBannerCaches(banners = []) {
  const list = Array.isArray(banners) ? banners : [];
  saveToStorage(KEYS.BANNERS, list);
  try {
    sessionStorage.removeItem(SESSION_BANNER_KEY);
    sessionStorage.removeItem(KEYS.BANNERS);
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.querySelectorAll('link[data-hero-preload]').forEach((el) => el.remove());
  }
}

export function loadBannersFromStorage() {
  return loadArrayFromStorage(KEYS.BANNERS, []);
}

export function persistBannersToStorage(banners) {
  clearBannerCaches(banners);
}
