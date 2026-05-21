/** Sunucuya yayınlanırken API gizli anahtarlarını çıkar */
export function settingsForPublish(settings) {
  if (!settings || typeof settings !== 'object') return settings;
  return {
    ...settings,
    trendyolApiKey: '',
    trendyolApiSecret: '',
  };
}

export function mergePublishedSettings(local, published) {
  if (!published || typeof published !== 'object') return local;
  return {
    ...local,
    ...published,
    trendyolApiKey: local.trendyolApiKey || published.trendyolApiKey || '',
    trendyolApiSecret: local.trendyolApiSecret || published.trendyolApiSecret || '',
    trendyolSupplierId: local.trendyolSupplierId || published.trendyolSupplierId || '',
    trendyolPriceDivisor: local.trendyolPriceDivisor || published.trendyolPriceDivisor || '4',
    pdfSettings: local.pdfSettings || published.pdfSettings,
    homepageSlots: published.homepageSlots || local.homepageSlots,
    homepageLayout: published.homepageLayout || local.homepageLayout,
    promotions: published.promotions || local.promotions,
  };
}
