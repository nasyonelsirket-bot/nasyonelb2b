import { DEFAULT_SETTINGS, DEMO_CATEGORIES } from '@/data/demoProducts';
import { suggestEmojiForName } from '@/data/categoryEmojis';
import { loadFromStorage, loadArrayFromStorage, saveToStorage, KEYS } from '@/utils/storage';

export const BRAND_VERSION = 3;
const BRAND_VERSION_KEY = 'b2b_brand_version';

function shouldResetLogo(logoUrl) {
  if (!logoUrl) return true;
  if (logoUrl.startsWith('data:')) return true;
  if (logoUrl.endsWith('/logo.svg') && !logoUrl.includes('?')) return true;
  return false;
}

function refreshCategoryIcons(categories, { force = false } = {}) {
  return (Array.isArray(categories) ? categories : []).map((cat) => {
    const suggested = suggestEmojiForName(cat.name);
    const generic = !cat.icon || cat.icon === '📦' || cat.icon === '🛒';
    return {
      ...cat,
      icon: force || generic ? suggested : cat.icon,
    };
  });
}

/** Eski localStorage verisini yeni logo + emojilerle günceller (bir kez) */
export function runBrandMigration() {
  try {
    const current = parseInt(localStorage.getItem(BRAND_VERSION_KEY) || '0', 10);
    if (current >= BRAND_VERSION) return null;

    const storedSettings = loadFromStorage(KEYS.SETTINGS, null);
    const safeSettings =
      storedSettings && typeof storedSettings === 'object' && !Array.isArray(storedSettings)
        ? storedSettings
        : {};

    const settings = { ...DEFAULT_SETTINGS, ...safeSettings };

    if (shouldResetLogo(settings.logoUrl)) {
      settings.logoUrl = '/nasyonel-logo.png?v=3';
    }
    if (!settings.siteName || settings.siteName.includes('ToyWholesale')) {
      settings.siteName = DEFAULT_SETTINGS.siteName;
    }
    if (!settings.tagline || settings.tagline.includes('ToyWholesale')) {
      settings.tagline = DEFAULT_SETTINGS.tagline;
    }

    const storedCategories = loadArrayFromStorage(KEYS.CATEGORIES, []);
    const categories = refreshCategoryIcons(
      storedCategories.length ? storedCategories : DEMO_CATEGORIES,
      { force: true },
    );

    saveToStorage(KEYS.SETTINGS, settings);
    saveToStorage(KEYS.CATEGORIES, categories);

    localStorage.setItem(BRAND_VERSION_KEY, String(BRAND_VERSION));

    return { settings, categories: categories || null };
  } catch {
    return null;
  }
}

export { refreshCategoryIcons };
