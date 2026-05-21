import { useMemo, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Package, Truck, Shield, Headphones } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import HeroBanner from '@/components/home/HeroBanner';
import CategorySlider from '@/components/home/CategorySlider';
import ProductGrid from '@/components/home/ProductGrid';
import FreeShippingBanner from '@/components/cart/FreeShippingBanner';
import { useStore } from '@/context/StoreContext';

const FEATURES = [
  { icon: Package, title: '%50\'ye Varan İndirim', desc: 'Fırsat fiyatları' },
  { icon: Truck, title: '750 TL Kargo Bedava', desc: 'Altında sadece 100 TL' },
  { icon: Shield, title: 'Güvenli Alışveriş', desc: '15+ yıl tecrübe' },
  { icon: Headphones, title: 'IBAN %10 İndirim', desc: 'WhatsApp ile sipariş' },
];

export default function HomePage() {
  const { products } = useStore();
  const [params] = useSearchParams();
  const { hash } = useLocation();
  const q = params.get('q')?.toLowerCase();

  const filtered = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [products, q]);

  useEffect(() => {
    if (hash === '#urunler') {
      const el = document.getElementById('urunler');
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    }
  }, [hash, filtered.length]);

  return (
    <>
      <SEO
        title="Ana Sayfa"
        description="Nasyonel Toys online oyuncak mağazası. Geniş katalog, güvenli alışveriş, WhatsApp ile sipariş."
        path="/"
      />
      <HeroBanner />
      <CategorySlider />

      <section className="mx-auto max-w-7xl px-3 sm:px-4 py-4 animate-fade-in">
        <FreeShippingBanner subtotal={0} />
      </section>

      <section className="border-y border-brand-100 bg-white py-6 sm:py-8 animate-slide-up">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-brand-900 text-accent-gold shadow-md shadow-brand-900/15">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-brand-900 text-sm sm:text-base">{title}</p>
                <p className="text-xs sm:text-sm text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ProductGrid
        products={filtered}
        title={q ? `Arama: "${q}"` : 'Tüm Ürünler'}
        subtitle={`${filtered.length} ürün listeleniyor`}
      />
    </>
  );
}
