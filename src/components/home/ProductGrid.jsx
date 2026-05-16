import ProductCard from '@/components/product/ProductCard';
import KdvNotice from '@/components/ui/KdvNotice';

export default function ProductGrid({ products, title, subtitle }) {
  if (!products?.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Ürün bulunamadı.</p>
      </div>
    );
  }

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && (
              <h2 className="font-display text-2xl font-bold text-brand-900">{title}</h2>
            )}
            {subtitle && <p className="mt-1 text-gray-600">{subtitle}</p>}
            <KdvNotice className="mt-2" />
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
