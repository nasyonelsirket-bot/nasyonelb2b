import { normalizeHomepageLayout } from '@/utils/homepagePlacements';

/** Silinen banner ID'sini yerleşimden kaldır */
export function pruneBannerIdFromLayout(settings, deletedId) {
  if (!deletedId) return null;
  const layout = normalizeHomepageLayout(settings);
  let changed = false;
  const sections = { ...layout.sections };

  for (const [key, cfg] of Object.entries(sections)) {
    if (!key.startsWith('banner-') || !cfg?.bannerIds?.length) continue;
    const nextIds = cfg.bannerIds.filter((id) => id !== deletedId);
    if (nextIds.length !== cfg.bannerIds.length) {
      sections[key] = { ...cfg, bannerIds: nextIds };
      changed = true;
    }
  }

  if (!changed) return null;
  return {
    homepageLayout: {
      order: layout.order,
      sections,
    },
  };
}

/** Yerleşimdeki banner ID sırası (tek kaynak) */
export function resolveBannersForSlot(banners, bannerIds) {
  const catalog = Array.isArray(banners) ? banners : [];
  const active = catalog.filter((b) => b?.id && b.active !== false && b.image);
  const ids = Array.isArray(bannerIds) ? bannerIds.filter(Boolean) : [];

  if (!ids.length) return [];

  const byId = new Map(active.map((b) => [b.id, b]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}
