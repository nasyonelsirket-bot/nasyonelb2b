import { useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import SEO from '@/components/seo/SEO';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import ProductGrid from '@/components/home/ProductGrid';
import { useStore } from '@/context/StoreContext';
import {
  getMainCategoryBySlug,
  productMatchesMainCategory,
  filterProductsBySubcategory,
  getSubcategoriesForMain,
} from '@/data/mainCategories';

export default function CategoryLandingPage() {
  const { pathname } = useLocation();
  const categorySlug = pathname.replace(/^\//, '').split('/')[0];
  const [params] = useSearchParams();
  const subFilter = params.get('alt');
  const { products } = useStore();

  const main = getMainCategoryBySlug(categorySlug);

  const filtered = useMemo(() => {
    if (!main) return [];
    if (subFilter) return filterProductsBySubcategory(products, main, subFilter);
    return (products || []).filter((p) => productMatchesMainCategory(p, main));
  }, [products, main, subFilter]);

  const subs = useMemo(
    () => (main ? getSubcategoriesForMain(products, main) : []),
    [products, main],
  );

  if (!main) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-gray-500">Kategori bulunamadı.</p>
        <Link to="/kategoriler" className="mt-4 inline-block text-brand-600 hover:underline">
          Tüm kategorilere dön
        </Link>
      </div>
    );
  }

  const path = `/${main.slug}`;
  const title = subFilter ? `${subFilter} — ${main.name}` : main.name;

  return (
    <>
      <SEO
        title={main.seoTitle}
        description={main.seoDescription}
        path={subFilter ? `${path}?alt=${encodeURIComponent(subFilter)}` : path}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Ana Sayfa', href: '/' },
          { name: main.name, href: path },
          ...(subFilter ? [{ name: subFilter, href: `${path}?alt=${encodeURIComponent(subFilter)}` }] : []),
        ]}
      />

      <div className="bg-brand-900 text-white py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Breadcrumbs
            className="mb-4 text-brand-200"
            items={[
              { label: 'Ana Sayfa', to: '/' },
              { label: main.name, to: path },
              ...(subFilter ? [{ label: subFilter }] : []),
            ]}
          />
          <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <span aria-hidden>{main.icon}</span>
            {title}
          </h1>
          <p className="mt-3 text-brand-100 max-w-2xl text-sm sm:text-base leading-relaxed">{main.intro}</p>
          {subs.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                to={path}
                className={`rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium ${!subFilter ? 'bg-accent-gold text-brand-950' : 'bg-brand-800 text-white hover:bg-brand-700'}`}
              >
                Tümü
              </Link>
              {subs.map((s) => (
                <Link
                  key={s.name}
                  to={`${path}?alt=${encodeURIComponent(s.name)}`}
                  className={`rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium ${subFilter === s.name ? 'bg-accent-gold text-brand-950' : 'bg-brand-800 text-white hover:bg-brand-700'}`}
                >
                  {s.name} ({s.count})
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProductGrid products={filtered} title="" subtitle={`${filtered.length} ürün`} showSort />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-12">
        <div className="rounded-2xl border border-brand-100 bg-white p-6 sm:p-8 text-sm text-gray-600 leading-relaxed">
          <h2 className="font-display font-bold text-brand-900 mb-2">{main.name} hakkında</h2>
          <p>{main.seoFooter}</p>
        </div>
      </section>
    </>
  );
}
