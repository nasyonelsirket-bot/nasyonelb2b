import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import Button from '@/components/ui/Button';

const AUTO_MS = 5500;
const SWIPE_THRESHOLD = 48;

export default function HeroBanner() {
  const { banners } = useStore();
  const active = (Array.isArray(banners) ? banners : []).filter((b) => b.active !== false && b.image);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(null);

  const count = active.length;
  const go = useCallback(
    (delta) => {
      if (count <= 1) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  useEffect(() => {
    setIndex((i) => (count ? Math.min(i, count - 1) : 0));
  }, [count]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const t = setInterval(() => go(1), AUTO_MS);
    return () => clearInterval(t);
  }, [count, paused, go]);

  const onTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    go(dx < 0 ? 1 : -1);
  };

  if (!count) return null;

  return (
    <section
      className="hero-carousel relative mx-3 mt-4 sm:mx-6 sm:mt-6 lg:mx-auto lg:max-w-7xl lg:px-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-label="Kampanya bannerları"
      aria-roledescription="carousel"
    >
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-lg bg-brand-950">
        <div className="relative min-h-[180px] sm:min-h-[240px] md:min-h-[280px] flex items-center justify-center" aria-live="polite">
          {active.map((banner, i) => {
            const isActive = i === index;
            const hasText = Boolean(banner.title?.trim() || banner.subtitle?.trim());
            const link = banner.link?.trim() || '';
            const slide = (
              <>
                <img
                  src={banner.image}
                  alt={banner.title?.trim() || `Banner ${i + 1}`}
                  className={`hero-banner-img max-w-full max-h-[50vh] w-auto h-auto object-contain mx-auto block ${
                    isActive ? 'hero-slide-img-active' : ''
                  }`}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                />
                {hasText && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-950/85 via-brand-900/50 to-transparent sm:via-brand-900/40 pointer-events-none" />
                    <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-10 lg:px-14 max-w-xl pointer-events-none">
                      {banner.title?.trim() && (
                        <h2 className="font-display text-xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-sm">
                          {banner.title}
                        </h2>
                      )}
                      {banner.subtitle?.trim() && (
                        <p className="mt-2 text-sm sm:text-lg text-brand-100/95 line-clamp-2">{banner.subtitle}</p>
                      )}
                      {link && banner.title?.trim() && (
                        <div className="mt-4 pointer-events-auto">
                          <Link to={link}>
                            <Button variant="gold" size="md" className="sm:size-lg">
                              Keşfet <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            );

            return (
              <div
                key={banner.id}
                className={`hero-slide absolute inset-0 flex items-center justify-center p-2 sm:p-4 ${
                  isActive ? 'hero-slide-active z-10' : 'hero-slide-idle z-0'
                }`}
                aria-hidden={!isActive}
              >
                {link && !hasText ? (
                  <Link to={link} className="flex w-full h-full items-center justify-center" tabIndex={isActive ? 0 : -1}>
                    {slide}
                  </Link>
                ) : (
                  slide
                )}
              </div>
            );
          })}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-brand-950/40 p-1.5 text-white backdrop-blur-sm transition hover:bg-brand-950/60 sm:left-4 sm:p-2"
              aria-label="Önceki banner"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-brand-950/40 p-1.5 text-white backdrop-blur-sm transition hover:bg-brand-950/60 sm:right-4 sm:p-2"
              aria-label="Sonraki banner"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 sm:bottom-4 sm:gap-2">
              {active.map((banner, i) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === index
                      ? 'h-2 w-6 sm:w-8 bg-accent-gold shadow-sm'
                      : 'h-2 w-2 bg-white/60 hover:bg-white/90'
                  }`}
                  aria-label={`Banner ${i + 1}`}
                  aria-current={i === index ? 'true' : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
