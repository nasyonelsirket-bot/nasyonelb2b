import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { markBestSellerFlags } from '@/utils/productBestseller';

const SCROLL_STEP = 0.82;

export default function ProductStrip({
  products,
  title,
  subtitle,
  badge,
  seeAllHref = '/#urunler',
  seeAllLabel = 'Tümünü Gör',
  accent = 'orange',
  markBestsellers = true,
}) {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const list = markBestsellers
    ? markBestSellerFlags(Array.isArray(products) ? products : [], 12)
    : Array.isArray(products) ? products : [];

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

  const accentStyles = {
    orange: {
      bar: 'bg-gradient-to-r from-orange-500 to-amber-500',
      badge: 'bg-orange-100 text-orange-800',
      badgeIcon: Flame,
      link: 'text-orange-600 hover:text-orange-700',
    },
    brand: {
      bar: 'bg-gradient-to-r from-brand-700 to-brand-900',
      badge: 'bg-brand-100 text-brand-800',
      badgeIcon: Flame,
      link: 'text-brand-700 hover:text-brand-900',
    },
  };
  const style = accentStyles[accent] || accentStyles.orange;
  const BadgeIcon = style.badgeIcon;

  return (
    <section className="py-4 sm:py-6 bg-white border-y border-gray-100">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-1 sm:w-1.5 self-stretch rounded-full shrink-0 ${style.bar}`} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg sm:text-2xl font-bold text-gray-900">{title}</h2>
                {badge && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase ${style.badge}`}
                  >
                    <BadgeIcon className="h-3 w-3" />
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <Link
            to={seeAllHref}
            className="shrink-0 text-sm font-bold text-orange-600 hover:text-orange-700 whitespace-nowrap"
          >
            {seeAllLabel} →
          </Link>
        </div>

        <div className="relative group/strip">
          {canLeft && (
            <button
              type="button"
              onClick={() => scrollByStep(-1)}
              className="absolute left-0 top-[38%] z-10 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-lg text-gray-800 hover:bg-gray-50"
              aria-label="Önceki"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {canRight && (
            <button
              type="button"
              onClick={() => scrollByStep(1)}
              className="absolute right-0 top-[38%] z-10 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-lg text-gray-800 hover:bg-gray-50"
              aria-label="Sonraki"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <div
            ref={trackRef}
            className="product-strip-track flex gap-2 sm:gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth touch-pan-x"
          >
            {list.map((p) => (
              <div
                key={p.id}
                className="product-strip-item shrink-0 snap-start w-[calc(50%-0.25rem)] min-w-[9.5rem] sm:min-w-[17.5rem] sm:w-[17.75rem] md:w-[19rem] lg:w-[20rem]"
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
