const LEGACY_PRICE_FLOOR = 150;
const LEGACY_PRICE_BUMP_TL = 40;

/**
 * Mevcut katalog ürünlerinde 150 TL üzeri fiyatlara tek seferlik +40 TL.
 * legacyPriceMigrated işaretli veya manualPrice olan ürünlere dokunulmaz.
 */
export function migrateLegacyProductPrices(products = []) {
  const log = [];
  const updated = (Array.isArray(products) ? products : []).map((product) => {
    if (!product || typeof product !== 'object') return product;
    if (product.legacyPriceMigrated === true || product.manualPrice === true) {
      return product;
    }

    const price = Number(product.price) || 0;
    if (price <= LEGACY_PRICE_FLOOR) return product;

    const newPrice = Math.round((price + LEGACY_PRICE_BUMP_TL) * 100) / 100;
    log.push({
      id: product.id,
      sku: product.sku,
      name: product.name,
      oldPrice: price,
      newPrice,
    });

    return {
      ...product,
      price: newPrice,
      legacyPriceMigrated: true,
      legacyPriceMigratedAt: new Date().toISOString(),
    };
  });

  if (log.length && typeof console !== 'undefined') {
    console.info('[legacyPriceMigration]', `${log.length} ürün güncellendi`, log);
  }

  return { products: updated, log, changed: log.length > 0 };
}
