import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, CreditCard, SlidersHorizontal } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import KdvNotice from '@/components/ui/KdvNotice';
import Button from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { SORT_OPTIONS, sortProducts } from '@/utils/productSortFilter';

const PAGE_SIZE = 24;

export default function ProductGrid({
  products,
  title,
  subtitle,
  onOpenCart,
  defaultSort = 'bestseller',
  showSort = true,
  previewLimit,
  seeAllHref,
  seeAllLabel = 'Tümünü Gör',
}) {
  const isPreview = previewLimit != null && previewLimit > 0;
  const pageSize = isPreview ? previewLimit : PAGE_SIZE;
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [sortKey, setSortKey] = useState(defaultSort);
  const sentinelRef = useRef(null);
  const { totalItems } = useCart();
  const list = useMemo(() => sortProducts(products, sortKey), [products, sortKey]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [list.length, pageSize]);

  const loadMore = useCallback(() => {
    if (isPreview) return;
    setVisibleCount((n) => Math.min(n + PAGE_SIZE, list.length));
  }, [isPreview, list.length]);

  useEffect(() => {
    if (isPreview) return undefined;
    const el = sentinelRef.current;
    if (!el || visibleCount >= list.length) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '200px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visibleCount, list.length, loadMore, isPreview]);

  if (!list.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Ürün bulunamadı.</p>
      </div>
    );
  }

  const visible = list.slice(0, isPreview ? previewLimit : visibleCount);
  const hasMore = !isPreview && visibleCount < list.length;
  const showSeeAll = isPreview && seeAllHref && list.length > previewLimit;

  return (
    <section id="urunler" className="py-4 sm:py-10 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        {(title || subtitle || onOpenCart || showSort) && (
          <div className="mb-4 sm:mb-8 px-1 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 className="font-display text-2xl font-bold text-brand-900">{title}</h2>
              )}
              {subtitle && <p className="mt-1 text-gray-600">{subtitle}</p>}
              <KdvNotice className="mt-2" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {showSort && (
                <label className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm">
                  <SlidersHorizontal className="h-4 w-4 text-brand-600 shrink-0" />
                  <span className="sr-only">Sırala</span>
                  <select
                    value={sortKey}
                    onChange={(e) => {
                      setSortKey(e.target.value);
                      setVisibleCount(pageSize);
                    }}
                    className="bg-transparent font-medium text-brand-900 outline-none cursor-pointer max-w-[200px] sm:max-w-none"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {onOpenCart && (
                <>
                  <Button type="button" variant="gold" size="sm" onClick={onOpenCart}>
                    <ShoppingCart className="h-4 w-4" />
                    Sepet ({totalItems})
                  </Button>
                  <Link to="/sepet">
                    <Button type="button" variant="primary" size="sm">
                      <CreditCard className="h-4 w-4" />
                      Ödeme
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
        <div className="product-grid grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {hasMore && (
          <div ref={sentinelRef} className="mt-8 flex justify-center py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" aria-hidden />
            <span className="sr-only">Daha fazla ürün yükleniyor</span>
          </div>
        )}
        {showSeeAll && (
          <div className="mt-8 flex justify-center px-2">
            <Link
              to={seeAllHref}
              className="inline-flex items-center justify-center rounded-xl bg-brand-900 px-8 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-800"
            >
              {seeAllLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
