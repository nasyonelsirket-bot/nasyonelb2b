import { useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import SEO from '@/components/seo/SEO';
import ProductGrid from '@/components/home/ProductGrid';
import EmptyCategoryFallback from '@/components/category/EmptyCategoryFallback';
import { useStore } from '@/context/StoreContext';
import { getCategorySearchScore } from '@/data/categorySearchRank';
import { getBestSellerProducts } from '@/utils/productBestseller';

export default function CategoriesPage() {
  const { products, categories } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cat = params.get('cat');
  const hepsi = params.get('hepsi') === '1';

  const filtered = useMemo(() => {
    if (!cat) return products;
    return products.filter((p) => p.category === cat);
  }, [products, cat]);

  const suggestions = useMemo(() => getBestSellerProducts(products, 8), [products]);

  const activeCategoryList = useMemo(() => {
    const cats = Array.isArray(categories) ? categories : [];
    const counts = {};
    products.forEach((p) => {
      const key = p.category || 'Genel';
      counts[key] = (counts[key] || 0) + 1;
    });
    return cats.filter((c) => (counts[c.name] || 0) > 0);
  }, [categories, products]);

  const grouped = useMemo(() => {
    if (cat || hepsi) return null;
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
  }, [cat, hepsi, categories, products]);

  const catHasProducts = !cat || filtered.length > 0;

  return (
    <>
      <SEO
        title={hepsi ? 'Tüm Ürünler' : 'Kategoriler'}
        description={
          hepsi
            ? 'Nasyonel Toys tüm ürünler — eğitici oyuncaklar, güvenli ödeme ve hızlı kargo.'
            : 'Nasyonel Toys oyuncak kategorileri ve ürün fiyatları'
        }
        path={hepsi ? '/kategoriler?hepsi=1' : '/kategoriler'}
      />
      <div className="bg-brand-900 text-white py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="font-display text-2xl sm:text-3xl font-bold">{hepsi ? 'Tüm Ürünler' : 'Kategoriler'}</h1>
          <p className="mt-2 text-sm sm:text-base text-brand-200">
            {hepsi
              ? `${products.length} ürün listeleniyor`
              : cat
                ? cat
                : 'Ürünler kategorilere göre listelenir'}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              to="/kategoriler"
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${!cat && !hepsi ? 'bg-accent-gold text-brand-950' : 'bg-brand-800 text-white hover:bg-brand-700'}`}
            >
              Tümü
            </Link>
            <Link
              to="/kategoriler?hepsi=1"
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${hepsi ? 'bg-accent-gold text-brand-950' : 'bg-brand-800 text-white hover:bg-brand-700'}`}
            >
              Tüm Ürünler
            </Link>
          </div>

          {cat && (
            <div className="mt-3 sm:mt-4">
              <label htmlFor="category-switch" className="sr-only">
                Kategori değiştir
              </label>
              <select
                id="category-switch"
                value={cat}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next) navigate(`/kategoriler?cat=${encodeURIComponent(next)}`);
                }}
                className="w-full sm:max-w-md rounded-xl border border-brand-700 bg-brand-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
              >
                {activeCategoryList.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!cat && !hepsi && activeCategoryList.length > 0 && (
            <div className="mt-3 hidden lg:flex flex-wrap gap-2 max-h-[4.5rem] overflow-hidden">
              {activeCategoryList.slice(0, 10).map((c) => (
                <Link
                  key={c.id || c.name}
                  to={`/kategoriler?cat=${encodeURIComponent(c.name)}`}
                  className="rounded-full px-4 py-1.5 text-sm font-medium bg-brand-800 text-white hover:bg-brand-700"
                >
                  {c.name}
                </Link>
              ))}
              {activeCategoryList.length > 10 && (
                <span className="self-center text-xs text-brand-300">
                  +{activeCategoryList.length - 10} kategori aşağıda
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {hepsi ? (
        <ProductGrid
          products={products}
          title=""
          subtitle={`${products.length} ürün — sıralamayı değiştirin`}
        />
      ) : cat && !catHasProducts ? (
        <EmptyCategoryFallback
          title={`"${cat}" kategorisinde ürün yok`}
          message="Bu kategoride şu an listelenecek ürün bulunmuyor. Diğer kategorilerdeki ürünleri inceleyebilirsiniz."
          products={products}
          suggestions={suggestions}
        />
      ) : cat ? (
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
            <EmptyCategoryFallback
              products={products}
              suggestions={suggestions}
            />
          )}
        </div>
      )}
    </>
  );
}
