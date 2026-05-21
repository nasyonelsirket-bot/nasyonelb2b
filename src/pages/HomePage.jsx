import { useMemo, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import HeroBanner from '@/components/home/HeroBanner';
import ProductGrid from '@/components/home/ProductGrid';
import ProductStrip from '@/components/home/ProductStrip';
import FreeShippingBanner from '@/components/cart/FreeShippingBanner';
import OrderTrackSection from '@/components/home/OrderTrackSection';
import TrustBadges from '@/components/home/TrustBadges';
import HomeCartDrawer from '@/components/home/HomeCartDrawer';
import HomeStickyCartBar from '@/components/home/HomeStickyCartBar';
import Button from '@/components/ui/Button';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import { getCartSubtotal } from '@/utils/cartLinePricing';
import { hasProductDiscount, getDiscountPercent } from '@/utils/productPricing';
import {
  getBestSellerProducts,
  filterEducationalProducts,
  hasTrendyolSalesData,
} from '@/utils/productBestseller';

const HASH_SECTIONS = ['urunler', 'cok-satanlar', 'firsatlar', 'egitici', 'siparis-takip', 'sss'];

export default function HomePage() {
  const { products } = useStore();
  const { items, totalItems } = useCart();
  const [params] = useSearchParams();
  const { hash } = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const q = params.get('q')?.toLowerCase();

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const subtotal = useMemo(() => getCartSubtotal(items), [items]);
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
    <div className="pb-24 sm:pb-28 bg-gray-50">
      <SEO
        title="Ana Sayfa"
        description="Nasyonel Toys — eğitici oyuncaklar, en çok satanlar, %50 indirim fırsatları."
        path="/"
      />

      <HeroBanner />

      <div id="siparis-takip" className="scroll-mt-24">
        <OrderTrackSection />
      </div>

      {!q && bestSellers.length > 0 && (
        <div id="cok-satanlar" className="scroll-mt-32">
          <ProductStrip
            products={bestSellers}
            title="En Çok Satanlar"
            subtitle={
              hasOrderSales
                ? 'Son 30 günde en çok tercih edilen ürünler'
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

      <section className="mx-auto max-w-7xl px-3 sm:px-4 py-2">
        <FreeShippingBanner subtotal={subtotal} />
      </section>

      <TrustBadges />

      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4 flex flex-wrap justify-center gap-2">
        <Button type="button" variant="gold" size="lg" className="min-h-[48px]" onClick={openCart}>
          <ShoppingCart className="h-5 w-5" />
          Sepetimi göster ({totalItems})
        </Button>
        <Link to="/sepet">
          <Button type="button" variant="primary" size="lg" className="min-h-[48px]">
            Ödemeye geç <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>

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
      <HomeStickyCartBar onOpenCart={openCart} />
    </div>
  );
}
