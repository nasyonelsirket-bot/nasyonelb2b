import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

const SCROLL_STEP_RATIO = 0.75;

export default function CategorySlider() {
  const { categories } = useStore();
  const list = Array.isArray(categories) ? categories : [];
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 });

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

  const scrollByStep = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const step = el.clientWidth * SCROLL_STEP_RATIO;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  const onPointerDown = (e) => {
    const el = trackRef.current;
    if (!el || e.button !== 0 || e.pointerType !== 'mouse') return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
    el.setPointerCapture(e.pointerId);
    el.style.scrollBehavior = 'auto';
    el.style.cursor = 'grabbing';
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.active) return;
    const el = trackRef.current;
    if (!el) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 8) dragRef.current.moved = true;
    el.scrollLeft = dragRef.current.scrollLeft - dx;
  };

  const endDrag = (e) => {
    const el = trackRef.current;
    if (!el || !dragRef.current.active) return;
    dragRef.current.active = false;
    el.style.scrollBehavior = 'smooth';
    el.style.cursor = 'grab';
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    updateArrows();
  };

  const onCardClick = (e) => {
    if (dragRef.current.moved) e.preventDefault();
  };

  if (!list.length) return null;

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-bold text-brand-900 mb-6">Kategoriler</h2>

        <div className="relative group/slider">
          {canLeft && (
            <div
              className="pointer-events-none absolute left-0 top-0 bottom-2 z-10 w-16 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent"
              aria-hidden
            />
          )}
          {canRight && (
            <div
              className="pointer-events-none absolute right-0 top-0 bottom-2 z-10 w-16 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent"
              aria-hidden
            />
          )}

          <button
            type="button"
            onClick={() => scrollByStep(-1)}
            disabled={!canLeft}
            aria-label="Önceki kategoriler"
            className={`absolute left-0 top-1/2 z-20 -translate-y-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-900 shadow-lg transition-all duration-300 hover:bg-brand-900 hover:text-accent-gold hover:scale-110 hover:shadow-xl disabled:pointer-events-none disabled:opacity-0 disabled:scale-90 sm:h-11 sm:w-11 ${
              canLeft ? 'opacity-100' : ''
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => scrollByStep(1)}
            disabled={!canRight}
            aria-label="Sonraki kategoriler"
            className={`absolute right-0 top-1/2 z-20 -translate-y-1/2 translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-900 shadow-lg transition-all duration-300 hover:bg-brand-900 hover:text-accent-gold hover:scale-110 hover:shadow-xl disabled:pointer-events-none disabled:opacity-0 disabled:scale-90 sm:h-11 sm:w-11 ${
              canRight ? 'opacity-100' : ''
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            ref={trackRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            onPointerCancel={endDrag}
            className="category-track flex gap-4 overflow-x-auto pb-3 pt-1 px-1 cursor-grab select-none touch-pan-x snap-x snap-mandatory scroll-smooth"
          >
            {list.map((cat) => (
              <Link
                key={cat.id}
                to={`/kategoriler?cat=${encodeURIComponent(cat.name)}`}
                onClick={onCardClick}
                draggable={false}
                className="category-card flex shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border border-brand-100 bg-white px-6 py-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-400 hover:shadow-card-hover min-w-[120px] sm:min-w-[130px]"
              >
                <span className="text-3xl transition-transform duration-300 group-hover/slider:scale-105">
                  {cat.icon || '📦'}
                </span>
                <span className="text-sm font-semibold text-brand-800 text-center leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
