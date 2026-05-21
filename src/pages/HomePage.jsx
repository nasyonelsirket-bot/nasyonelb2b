import { useMemo, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { Package, Truck, Shield, Headphones, ShoppingCart, ArrowRight } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import HeroBanner from '@/components/home/HeroBanner';
import CategorySlider from '@/components/home/CategorySlider';
import ProductGrid from '@/components/home/ProductGrid';
import ProductStrip from '@/components/home/ProductStrip';
import FreeShippingBanner from '@/components/cart/FreeShippingBanner';
import HomeShopCTA from '@/components/home/HomeShopCTA';
import HomeUrgencyStrip from '@/components/home/HomeUrgencyStrip';
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
  sortByBestSellers,
  hasTrendyolSalesData,
} from '@/utils/productBestseller';

const FEATURES = [
  { icon: Package, title: '%50\'ye Varan İndirim', desc: 'Fırsat fiyatları' },
  { icon: Truck, title: '750 TL Kargo Bedava', desc: 'Altında sadece 100 TL' },
  { icon: Shield, title: 'Güvenli Alışveriş', desc: 'Kaliteli ürünler' },
  { icon: Headphones, title: 'IBAN %10 İndirim', desc: 'WhatsApp ile sipariş' },
];

const HASH_SECTIONS = ['urunler', 'cok-satanlar', 'firsatlar', 'egitici'];

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
    if (!q) return sortByBestSellers(catalog);
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

      <HomeUrgencyStrip onOpenCart={openCart} />
      <HeroBanner />

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
            seeAllHref="/#urunler"
            accent="orange"
          />
        </div>
      )}

      <CategorySlider />

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
            subtitle="En yüksek indirimli ürünler — sınırlı süre fırsatı"
            badge="İndirim"
            seeAllHref="/#firsatlar"
            accent="orange"
          />
        </div>
      )}

      <HomeShopCTA onOpenCart={openCart} />

      <section className="mx-auto max-w-7xl px-3 sm:px-4 py-2 animate-fade-in">
        <FreeShippingBanner subtotal={subtotal} />
      </section>

      <section className="border-y border-gray-200 bg-white py-6 sm:py-8 animate-slide-up">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <button
              key={title}
              type="button"
              onClick={openCart}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left rounded-xl hover:bg-orange-50/50 p-2 transition-colors touch-manipulation"
            >
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-xs sm:text-base">{title}</p>
                <p className="text-[10px] sm:text-sm text-gray-500">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

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
          subtitle={
            q
              ? `${filtered.length} ürün`
              : `${filtered.length} ürün — çok satanlara göre sıralı`
          }
          onOpenCart={openCart}
        />
      </div>

      <HomeCartDrawer open={cartOpen} onClose={closeCart} />
      <HomeStickyCartBar onOpenCart={openCart} />
    </div>
  );
}
