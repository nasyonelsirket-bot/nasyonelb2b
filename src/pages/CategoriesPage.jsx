import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SEO from '@/components/seo/SEO';
import ProductGrid from '@/components/home/ProductGrid';
import { useStore } from '@/context/StoreContext';
import { getCategorySearchScore } from '@/data/categorySearchRank';

export default function CategoriesPage() {
  const { products, categories } = useStore();
  const [params] = useSearchParams();
  const cat = params.get('cat');

  const filtered = useMemo(() => {
    if (!cat) return products;
    return products.filter((p) => p.category === cat);
  }, [products, cat]);

  const grouped = useMemo(() => {
    if (cat) return null;
    const cats = Array.isArray(categories) ? categories : [];
    const byName = new Map();
    products.forEach((p) => {
      const key = p.category || 'Genel';
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key).push(p);
    });

    if (cats.length) {
      return cats
        .map((c) => ({
          category: c,
          items: byName.get(c.name) || [],
        }))
        .filter((g) => g.items.length > 0);
    }

    return [...byName.entries()]
      .map(([name, items]) => ({
        category: { name, icon: '📦' },
        items,
      }))
      .sort((a, b) => {
        const scoreDiff = getCategorySearchScore(b.category.name) - getCategorySearchScore(a.category.name);
        if (scoreDiff !== 0) return scoreDiff;
        return b.items.length - a.items.length;
      });
  }, [cat, categories, products]);

  return (
    <>
      <SEO title="Kategoriler" description="Nasyonel Toys oyuncak kategorileri ve ürün fiyatları" path="/kategoriler" />
      <div className="bg-brand-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="font-display text-3xl font-bold">Kategoriler</h1>
          <p className="mt-2 text-brand-200">
            {cat ? cat : 'Ürünler kategorilere göre listelenir'}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/kategoriler"
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${!cat ? 'bg-accent-gold text-brand-950' : 'bg-brand-800 text-white hover:bg-brand-700'}`}
            >
              Tümü
            </Link>
            {(Array.isArray(categories) ? categories : []).map((c) => (
              <Link
                key={c.id}
                to={`/kategoriler?cat=${encodeURIComponent(c.name)}`}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${cat === c.name ? 'bg-accent-gold text-brand-950' : 'bg-brand-800 text-white hover:bg-brand-700'}`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {cat ? (
        <ProductGrid products={filtered} title={cat} />
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-10 space-y-12">
          {grouped?.map(({ category, items }) => (
            <section key={category.name}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="font-display text-xl font-bold text-brand-900 flex items-center gap-2">
                  <span className="text-2xl">{category.icon || '📦'}</span>
                  {category.name}
                  <span className="text-sm font-normal text-gray-500">({items.length} ürün)</span>
                </h2>
                <Link
                  to={`/kategoriler?cat=${encodeURIComponent(category.name)}`}
                  className="text-sm font-medium text-brand-700 hover:text-accent-gold-dark"
                >
                  Tümünü gör →
                </Link>
              </div>
              <ProductGrid products={items.slice(0, 8)} title="" subtitle="" />
            </section>
          ))}
          {!grouped?.length && (
            <p className="text-center text-gray-500 py-12">Henüz ürün bulunmuyor. Yakında yeni ürünler eklenecek.</p>
          )}
        </div>
      )}
    </>
  );
}
