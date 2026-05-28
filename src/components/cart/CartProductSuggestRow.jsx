import { useRef, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';

const SCROLL_STEP = 0.85;

/** Sepet içi yatay ürün öneri şeridi */
export default function CartProductSuggestRow({ title, subtitle, products, accent = 'brand' }) {
  const trackRef = useRef(null);
  const list = Array.isArray(products) ? products : [];
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 4);
    setCanRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [list.length, updateArrows]);

  const scrollByStep = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * SCROLL_STEP, behavior: 'smooth' });
  };

  if (!list.length) return null;

  const barClass =
    accent === 'violet'
      ? 'bg-gradient-to-b from-violet-500 to-purple-600'
      : 'bg-gradient-to-b from-brand-600 to-brand-800';

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-3 sm:p-4 shadow-sm">
      <div className="flex items-start gap-2.5 mb-3">
        <div className={`w-1 self-stretch rounded-full shrink-0 ${barClass}`} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm sm:text-base font-bold text-brand-900">{title}</h3>
          {subtitle ? (
            <p className="text-xs text-brand-600 mt-0.5 leading-relaxed">{subtitle}</p>
          ) : null}
        </div>
        <Link
          to="/kategoriler"
          className="shrink-0 text-xs font-bold text-brand-700 hover:text-accent-gold-dark whitespace-nowrap"
        >
          Tümü →
        </Link>
      </div>

      <div className="relative">
        {canLeft && (
          <button
            type="button"
            onClick={() => scrollByStep(-1)}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white border border-brand-200 shadow text-brand-800"
            aria-label="Önceki"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {canRight && (
          <button
            type="button"
            onClick={() => scrollByStep(1)}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white border border-brand-200 shadow text-brand-800"
            aria-label="Sonraki"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        <div
          ref={trackRef}
          className="flex gap-2 overflow-x-auto pb-1 snap-x snap-proximity scroll-smooth overscroll-x-contain -mx-0.5 px-0.5"
        >
          {list.map((p) => (
            <div
              key={p.id}
              className="shrink-0 snap-start w-[9.25rem] sm:w-[11.5rem] md:w-[12.5rem]"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
