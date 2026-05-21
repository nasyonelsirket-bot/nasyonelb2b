import { useMemo } from 'react';
import SEO from '@/components/seo/SEO';
import ProductGrid from '@/components/home/ProductGrid';
import { useStore } from '@/context/StoreContext';
import { hasTrendyolSalesData } from '@/utils/productBestseller';
import {
  resolveHomepageSection,
  normalizeHomepageLayout,
  countPinnedInSection,
} from '@/utils/homepagePlacements';

export default function BestSellersPage() {
  const { products, settings } = useStore();
  const catalog = useMemo(() => (Array.isArray(products) ? products : []), [products]);
  const layout = useMemo(() => normalizeHomepageLayout(settings), [settings]);
  const cfg = layout.sections.bestsellers;
  const pinnedCount = countPinnedInSection(layout, 'bestsellers');
  const bestSellers = useMemo(
    () => resolveHomepageSection(catalog, settings, 'bestsellers', 200),
    [catalog, settings],
  );
  const hasSales = useMemo(() => hasTrendyolSalesData(catalog), [catalog]);

  const title = cfg?.title || 'En Çok Satanlar';
  let subtitle = cfg?.subtitle;
  if (!subtitle) {
    subtitle =
      pinnedCount > 0
        ? `${bestSellers.length} ürün — ${pinnedCount} editör seçimi + satış sıralaması`
        : hasSales
          ? `${bestSellers.length} ürün — son 15 gün satış sıralaması (iptal/iade hariç)`
          : `${bestSellers.length} ürün — popülerlik sıralaması`;
  }

  return (
    <>
      <SEO
        title={title}
        description="Trendyol satış verilerine göre en çok tercih edilen oyuncaklar."
        path="/en-cok-satanlar"
      />
      <div className="bg-white min-h-[50vh]">
        <ProductGrid
          products={bestSellers}
          title={title}
          subtitle={subtitle}
          defaultSort="bestseller"
          showSort={false}
        />
      </div>
    </>
  );
}
