import { Link } from 'react-router-dom';
import { ArrowRight, LayoutGrid } from 'lucide-react';
import ProductGrid from '@/components/home/ProductGrid';
import Button from '@/components/ui/Button';
import { getActiveMainCategories } from '@/data/mainCategories';

/**
 * Boş kategori — 404 yerine yönlendirme + alternatif ürün önerileri
 */
export default function EmptyCategoryFallback({
  title,
  message,
  products = [],
  suggestions = [],
  categorySlug,
}) {
  const activeCategories = getActiveMainCategories(products);
  const altProducts = suggestions.length > 0 ? suggestions : products.slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="rounded-2xl border border-brand-100 bg-white p-6 sm:p-10 text-center shadow-card max-w-2xl mx-auto">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <LayoutGrid className="h-7 w-7" />
        </div>
        <h2 className="mt-4 font-display text-xl sm:text-2xl font-bold text-brand-900">
          {title || 'Bu kategoride henüz ürün yok'}
        </h2>
        <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
          {message ||
            'Seçtiğiniz kategoride şu an listelenecek ürün bulunmuyor. Diğer kategorilerimize göz atabilir veya öne çıkan ürünlerimizi inceleyebilirsiniz.'}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
          <Link to="/kategoriler">
            <Button type="button" variant="primary">
              Tüm kategoriler
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/en-cok-satanlar">
            <Button type="button" variant="outline">
              En çok satanlar
            </Button>
          </Link>
          {categorySlug && activeCategories.length > 0 && (
            <Link to={`/${activeCategories[0].slug}`}>
              <Button type="button" variant="outline">
                {activeCategories[0].name}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {activeCategories.length > 0 && (
        <div className="mt-10">
          <h3 className="font-display font-bold text-brand-900 mb-4">Diğer kategoriler</h3>
          <div className="flex flex-wrap gap-2">
            {activeCategories.map((c) => (
              <Link
                key={c.slug}
                to={`/${c.slug}`}
                className="rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50 hover:border-brand-300 transition-colors"
              >
                {c.icon} {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {altProducts.length > 0 && (
        <div className="mt-12">
          <ProductGrid
            products={altProducts}
            title="Size önerebileceğimiz ürünler"
            subtitle=""
            showSort={false}
          />
        </div>
      )}
    </div>
  );
}
