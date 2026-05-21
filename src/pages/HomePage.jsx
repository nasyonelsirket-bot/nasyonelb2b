import { useMemo, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import SEO from '@/components/seo/SEO';
import HeroBanner from '@/components/home/HeroBanner';
import ProductGrid from '@/components/home/ProductGrid';
import ProductStrip from '@/components/home/ProductStrip';
import HomeCartDrawer from '@/components/home/HomeCartDrawer';
import { useStore } from '@/context/StoreContext';
import { hasProductDiscount, getDiscountPercent } from '@/utils/productPricing';
import {
  getBestSellerProducts,
  filterEducationalProducts,
  hasTrendyolSalesData,
} from '@/utils/productBestseller';

const HASH_SECTIONS = ['urunler', 'cok-satanlar', 'firsatlar', 'egitici', 'sss'];

export default function HomePage() {
  const { products } = useStore();
  const [params] = useSearchParams();
  const { hash } = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const q = params.get('q')?.toLowerCase();

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const catalog = useMemo(() => (Array.isArray(products) ? products : []), [products]);

  const filtered = useMemo(() => {
    if (!q) return catalog;
    return catalog.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [catalog, q]);

  const bestSellers = useMemo(() => getBestSellerProducts(catalog, 16), [catalog]);
  const hasOrderSales = useMemo(() => hasTrendyolSalesData(catalog), [catalog]);

  const dealProducts = useMemo(() => {
    return catalog
      .filter((p) => hasProductDiscount(p))
      .sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))
      .slice(0, 12);
  }, [catalog]);

  const educationalProducts = useMemo(() => {
    const edu = filterEducationalProducts(catalog, 12);
    if (edu.length >= 4) return edu;
    return getBestSellerProducts(catalog, 12).filter((p) =>
      `${p.name} ${p.category}`.toLowerCase().match(/egitici|eğitici|zeka|puzzle|ahşap|montessori/i),
    );
  }, [catalog]);

  useEffect(() => {
    const id = hash.replace('#', '');
    if (!HASH_SECTIONS.includes(id)) return;
    const el = document.getElementById(id);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    }
    if (id === 'sepet') setCartOpen(true);
  }, [hash, filtered.length]);

  return (
    <div className="pb-8 bg-gray-50">
      <SEO
        title="Ana Sayfa"
        description="Nasyonel Toys — eğitici oyuncaklar, en çok satanlar, %50 indirim fırsatları."
        path="/"
      />

      <HeroBanner />

      {!q && bestSellers.length > 0 && (
        <div id="cok-satanlar" className="scroll-mt-32">
          <ProductStrip
            products={bestSellers}
            title="En Çok Satanlar"
            subtitle={
              hasOrderSales
                ? 'Son 15 günde en çok tercih edilen ürünler (iptal/iade hariç)'
                : 'Müşterilerimizin en çok tercih ettiği ürünler'
            }
            badge="Popüler"
            seeAllHref="/en-cok-satanlar"
            accent="orange"
          />
        </div>
      )}

      {!q && educationalProducts.length > 0 && (
        <div id="egitici" className="scroll-mt-32">
          <ProductStrip
            products={educationalProducts}
            title="Eğitici Oyuncaklar"
            subtitle="Montessori, zeka ve öğrenme oyuncakları"
            seeAllHref="/kategoriler?cat=Eğitici%20Oyuncaklar"
          />
        </div>
      )}

      {!q && dealProducts.length > 0 && (
        <div id="firsatlar" className="scroll-mt-32">
          <ProductStrip
            products={dealProducts}
            title="Flaş Fırsatlar"
            subtitle="En yüksek indirimli ürünler"
            badge="İndirim"
            seeAllHref="/#firsatlar"
            accent="orange"
          />
        </div>
      )}

      <div id="urunler" className="scroll-mt-32 bg-white">
        <ProductGrid
          products={filtered}
          title={q ? `Arama: "${q}"` : 'Tüm Ürünler'}
          subtitle={q ? `${filtered.length} ürün` : `${filtered.length} ürün — sıralamayı değiştirin`}
          showSort
          onOpenCart={openCart}
        />
      </div>

      <HomeCartDrawer open={cartOpen} onClose={closeCart} />
    </div>
  );
}
