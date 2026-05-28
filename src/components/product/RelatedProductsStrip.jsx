import { Link } from 'react-router-dom';
import ProductCard from '@/components/product/ProductCard';
import { getProductLink } from '@/utils/productSeo';
import { MAIN_CATEGORIES, productMatchesMainCategory } from '@/data/mainCategories';

/** İç linkleme — aynı kategoriden ürünler + kategori hub */
export default function RelatedProductsStrip({ product, allProducts = [] }) {
  if (!product) return null;

  const list = Array.isArray(allProducts) ? allProducts : [];
  const mainCat = MAIN_CATEGORIES.find((mc) => productMatchesMainCategory(product, mc));
  const related = list
    .filter((p) => p.id !== product.id)
    .filter((p) =>
      mainCat ? productMatchesMainCategory(p, mainCat) : p.category === product.category,
    )
    .slice(0, 4);

  return (
    <section className="mt-12 border-t border-brand-100 pt-10" aria-labelledby="related-products-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h2 id="related-products-heading" className="font-display text-xl font-bold text-brand-900">
            Benzer Ürünler
          </h2>
          <p className="text-sm text-gray-600 mt-1">Aynı kategoride önerilen oyuncaklar</p>
        </div>
        {mainCat && (
          <Link
            to={`/${mainCat.slug}`}
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            Tüm {mainCat.name} →
          </Link>
        )}
      </div>

      {related.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          <Link to={getProductLink(product)} className="text-brand-700 font-medium hover:underline">
            Kategorilere göz atın
          </Link>
        </p>
      )}
    </section>
  );
}
