import { getTrendyolUnitsSold } from '@/utils/productBestseller';

const BADGE_STYLES = {
  bestseller: 'bg-orange-500 text-white',
  trend: 'bg-violet-600 text-white',
  stock: 'bg-amber-500 text-brand-950',
  shipping: 'bg-emerald-600 text-white',
};

/** Ürün kartı köşe rozetleri — en fazla 2 adet */
export function getProductCardBadges(product, options = {}) {
  if (!product) return [];
  const { isBestSeller = false, isTrending = false } = options;
  const badges = [];
  const units = getTrendyolUnitsSold(product);

  if (isBestSeller || product.isBestSeller) {
    badges.push({ key: 'bestseller', label: 'Çok Satan', style: BADGE_STYLES.bestseller });
  } else if (isTrending || product.isCampaign) {
    badges.push({ key: 'trend', label: 'Trend Ürün', style: BADGE_STYLES.trend });
  }

  if (product.isNew) {
    badges.push({ key: 'stock', label: 'Sınırlı Stok', style: BADGE_STYLES.stock });
  } else if (units > 0 && units < 8) {
    badges.push({ key: 'stock', label: 'Sınırlı Stok', style: BADGE_STYLES.stock });
  }

  if (!badges.some((b) => b.key === 'stock')) {
    badges.push({ key: 'shipping', label: 'Bugün Kargoda', style: BADGE_STYLES.shipping });
  }

  return badges.slice(0, 2);
}
