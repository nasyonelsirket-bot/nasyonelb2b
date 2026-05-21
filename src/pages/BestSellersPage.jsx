import { useMemo } from 'react';
import SEO from '@/components/seo/SEO';
import ProductGrid from '@/components/home/ProductGrid';
import { useStore } from '@/context/StoreContext';
import { getBestSellerProducts, hasTrendyolSalesData } from '@/utils/productBestseller';

export default function BestSellersPage() {
  const { products } = useStore();
  const catalog = useMemo(() => (Array.isArray(products) ? products : []), [products]);
  const bestSellers = useMemo(() => getBestSellerProducts(catalog, 200), [catalog]);
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
            hasSales
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
