import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, Truck, Shield, Headphones } from 'lucide-react';
import SEO from '@/components/seo/SEO';
import HeroBanner from '@/components/home/HeroBanner';
import CategorySlider from '@/components/home/CategorySlider';
import ProductGrid from '@/components/home/ProductGrid';
import { useStore } from '@/context/StoreContext';

const FEATURES = [
  { icon: Package, title: '500+ Ürün', desc: 'Geniş oyuncak kataloğu' },
  { icon: Truck, title: 'Hızlı Sevkiyat', desc: 'Türkiye geneli teslimat' },
  { icon: Shield, title: 'Güvenilir B2B', desc: '15+ yıl tecrübe' },
  { icon: Headphones, title: 'WhatsApp Destek', desc: 'Anında sipariş' },
];

export default function HomePage() {
  const { products } = useStore();
  const [params] = useSearchParams();
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

  return (
    <>
      <SEO
        title="Ana Sayfa"
        description="B2B oyuncak toptan katalog. Toplu sipariş, WhatsApp sipariş, bayi fiyatları."
        path="/"
      />
      <HeroBanner />
      <CategorySlider />

      <section className="border-y border-brand-100 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-brand-900">{title}</p>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ProductGrid
        products={filtered.slice(0, 8)}
        title={q ? `Arama: "${q}"` : 'Öne Çıkan Ürünler'}
        subtitle="Toptan fiyatlarla hemen sipariş verin"
      />
    </>
  );
}
