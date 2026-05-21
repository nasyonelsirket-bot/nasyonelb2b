import { useMemo } from 'react';
import SEO from '@/components/seo/SEO';
import ProductGrid from '@/components/home/ProductGrid';
import { useStore } from '@/context/StoreContext';
import { hasTrendyolSalesData } from '@/utils/productBestseller';
import {
  resolveHomepageSection,
  normalizeHomepageSlots,
  countPinnedInSection,
} from '@/utils/homepagePlacements';

export default function BestSellersPage() {
  const { products, settings } = useStore();
  const catalog = useMemo(() => (Array.isArray(products) ? products : []), [products]);
  const homepageSlots = useMemo(
    () => normalizeHomepageSlots(settings?.homepageSlots),
    [settings?.homepageSlots],
  );
  const pinnedCount = countPinnedInSection(homepageSlots, 'bestsellers');
  const bestSellers = useMemo(
    () => resolveHomepageSection(catalog, homepageSlots, 'bestsellers', 200),
    [catalog, homepageSlots],
  );
  const hasSales = useMemo(() => hasTrendyolSalesData(catalog), [catalog]);

  return (
    <>
      <SEO
        title="En Çok Satanlar"
        description="Trendyol satış verilerine göre en çok tercih edilen oyuncaklar."
        path="/en-cok-satanlar"
      />
      <div className="bg-white min-h-[50vh]">
        <ProductGrid
          products={bestSellers}
          title="En Çok Satanlar"
          subtitle={
            pinnedCount > 0
              ? `${bestSellers.length} ürün — ${pinnedCount} editör seçimi + satış sıralaması`
              : hasSales
                ? `${bestSellers.length} ürün — son 15 gün satış sıralaması (iptal/iade hariç)`
                : `${bestSellers.length} ürün — popülerlik sıralaması`
          }
          defaultSort="bestseller"
          showSort={false}
        />
      </div>
    </>
  );
}
