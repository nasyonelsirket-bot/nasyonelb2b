const LEGACY_PRICE_FLOOR = 150;
const LEGACY_PRICE_BUMP_TL = 40;

function migrateLegacyProductPrices(products = []) {
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

  if (log.length) {
    console.log('[legacyPriceMigration]', JSON.stringify({ count: log.length, items: log.slice(0, 50) }));
  }

  return { products: updated, log, changed: log.length > 0 };
}

module.exports = { migrateLegacyProductPrices, LEGACY_PRICE_FLOOR, LEGACY_PRICE_BUMP_TL };
