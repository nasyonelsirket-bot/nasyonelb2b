import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import SEO from '@/components/seo/SEO';
import ProductGrid from '@/components/home/ProductGrid';
import { useStore } from '@/context/StoreContext';

export default function CategoriesPage() {
  const { products, categories } = useStore();
  const [params] = useSearchParams();
  const cat = params.get('cat');

  const filtered = useMemo(() => {
    if (!cat) return products;
    return products.filter((p) => p.category === cat);
  }, [products, cat]);

  return (
    <>
      <SEO title="Kategoriler" description="Oyuncak kategorileri - B2B toptan fiyatlar" path="/kategoriler" />
      <div className="bg-brand-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="font-display text-3xl font-bold">Kategoriler</h1>
          <p className="mt-2 text-brand-200">
            {cat ? cat : 'Tüm ürün kategorilerimizi keşfedin'}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href="/kategoriler"
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${!cat ? 'bg-white text-brand-900' : 'bg-brand-800 text-white hover:bg-brand-700'}`}
            >
              Tümü
            </a>
            {categories.map((c) => (
              <a
                key={c.id}
                href={`/kategoriler?cat=${encodeURIComponent(c.name)}`}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${cat === c.name ? 'bg-white text-brand-900' : 'bg-brand-800 text-white hover:bg-brand-700'}`}
              >
                {c.icon} {c.name}
              </a>
            ))}
          </div>
        </div>
      </div>
      <ProductGrid products={filtered} title={cat || 'Tüm Ürünler'} />
    </>
  );
}
