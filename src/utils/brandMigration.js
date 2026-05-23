import { DEFAULT_SETTINGS, DEMO_CATEGORIES } from '@/data/demoProducts';
import { mergePdfSettings } from '@/data/pdfSettingsDefaults';
import { MAP_ADDRESS } from '@/utils/categories';
import { suggestEmojiForName } from '@/data/categoryEmojis';
import { loadFromStorage, loadArrayFromStorage, saveToStorage, KEYS } from '@/utils/storage';

export const BRAND_VERSION = 15;
const BRAND_VERSION_KEY = 'b2b_brand_version';

function shouldResetLogo(logoUrl) {
  if (!logoUrl) return true;
  if (logoUrl.startsWith('data:')) return false;
  if (!logoUrl.includes('nasyonel-logo.png?v=5')) return true;
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
      settings.logoUrl = '/nasyonel-logo.png?v=5';
    }
    if (
      !settings.siteName ||
      settings.siteName.includes('ToyWholesale') ||
      settings.siteName.includes('B2B')
    ) {
      settings.siteName = DEFAULT_SETTINGS.siteName;
    }
    if (!settings.tagline || settings.tagline.includes('ToyWholesale')) {
      settings.tagline = DEFAULT_SETTINGS.tagline;
    }
    if (
      !settings.contactAddress ||
      settings.contactAddress === 'İstanbul, Türkiye' ||
      settings.contactEmail?.includes('toywholesale')
    ) {
      settings.contactAddress = DEFAULT_SETTINGS.contactAddress;
      settings.contactMapQuery = DEFAULT_SETTINGS.contactMapQuery;
      settings.contactEmail = DEFAULT_SETTINGS.contactEmail;
    }
    if (
      !settings.aboutText ||
      /toywholesale/i.test(settings.aboutText) ||
      settings.aboutText.includes('15 yılı aşkın')
    ) {
      settings.aboutText = DEFAULT_SETTINGS.aboutText;
    }
    delete settings.minOrderLineValue;
    if (!settings.trendyolPriceDivisor || settings.trendyolPriceDivisor === '4') {
      settings.trendyolPriceDivisor = '2';
    }
    settings.pdfSettings = mergePdfSettings(settings.pdfSettings || DEFAULT_SETTINGS.pdfSettings);

    if (settings.promotions && typeof settings.promotions === 'object') {
      const threshold = Number(settings.promotions.freeShippingThreshold);
      settings.promotions = {
        ...DEFAULT_SETTINGS.promotions,
        ...settings.promotions,
        freeShippingThreshold: !threshold || threshold === 750 ? 500 : threshold,
      };
      if (Array.isArray(settings.promotions.campaigns)) {
        settings.promotions.campaigns = settings.promotions.campaigns.map((c) => {
          if (!c?.description || !String(c.description).includes('750 TL')) return c;
          return {
            ...c,
            description: String(c.description).replace(/750 TL/g, '500 TL'),
          };
        });
      }
    } else {
      settings.promotions = { ...DEFAULT_SETTINGS.promotions };
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
