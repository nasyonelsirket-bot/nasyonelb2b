import { useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import ProductStrip from '@/components/home/ProductStrip';
import { getRecentlyViewedIds } from '@/utils/recentlyViewed';
import { markBestSellerFlags } from '@/utils/productBestseller';

export default function RecentlyViewedStrip() {
  const { products } = useStore();
  const ids = useMemo(() => getRecentlyViewedIds(), []);

  const list = useMemo(() => {
    if (!ids.length) return [];
    const catalog = Array.isArray(products) ? products : [];
    const byId = new Map(catalog.map((p) => [p.id, p]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
    return markBestSellerFlags(ordered, 24).slice(0, 8);
  }, [products, ids]);

  if (list.length < 2) return null;

  return (
    <ProductStrip
      products={list}
      title="Son Baktığınız Ürünler"
      subtitle="Hızlıca geri dönün"
      accent="brand"
      markBestsellers={false}
    />
  );
}
