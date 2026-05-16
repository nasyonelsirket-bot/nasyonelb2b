import { useState, useEffect } from 'react';
import ProductCard from '@/components/product/ProductCard';
import KdvNotice from '@/components/ui/KdvNotice';
import Button from '@/components/ui/Button';

const PAGE_SIZE = 24;

export default function ProductGrid({ products, title, subtitle }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const list = Array.isArray(products) ? products : [];

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [list.length]);

  if (!list.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Ürün bulunamadı.</p>
      </div>
    );
  }

  const visible = list.slice(0, visibleCount);
  const hasMore = visibleCount < list.length;

  return (
    <section id="urunler" className="py-4 sm:py-10 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="mb-4 sm:mb-8 px-1">
            {title && (
              <h2 className="font-display text-2xl font-bold text-brand-900">{title}</h2>
            )}
            {subtitle && <p className="mt-1 text-gray-600">{subtitle}</p>}
            <KdvNotice className="mt-2" />
          </div>
        )}
        <div className="product-grid grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {hasMore && (
          <div className="mt-8 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="min-h-[48px] touch-manipulation"
              onClick={() => setVisibleCount((n) => Math.min(n + PAGE_SIZE, list.length))}
            >
              Daha fazla göster ({list.length - visibleCount} kaldı)
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
