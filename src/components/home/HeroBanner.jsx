import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { PRODUCTS_SECTION_PATH } from '@/constants/siteLinks';

const AUTO_MS = 5500;
const SWIPE_THRESHOLD = 48;

/**
 * @param {{ bannerIds?: string[] }} props
 * bannerIds doluysa yalnızca seçilen görseller; boşsa tüm aktif bannerlar
 */
export default function HeroBanner({ bannerIds }) {
  const { banners } = useStore();
  const allActive = useMemo(
    () => (Array.isArray(banners) ? banners : []).filter((b) => b.active !== false && b.image),
    [banners],
  );

  const active = useMemo(() => {
    const ids = Array.isArray(bannerIds) ? bannerIds.filter(Boolean) : [];
    if (!ids.length) return allActive;
    const byId = new Map(allActive.map((b) => [b.id, b]));
    return ids.map((id) => byId.get(id)).filter(Boolean);
  }, [allActive, bannerIds]);

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
    if (count <= 1 || paused) return undefined;
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
      className="hero-carousel relative mx-2 mt-3 sm:mx-6 sm:mt-6 lg:mx-auto lg:max-w-7xl lg:px-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-label="Kampanya bannerları"
      aria-roledescription="carousel"
    >
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-lg bg-brand-950">
        <div className="hero-banner-frame relative w-full">
          {active.map((banner, i) => {
            if (i !== index) return null;
            const hasText = Boolean(banner.title?.trim() || banner.subtitle?.trim());
            const linkTo = banner.link?.trim() || PRODUCTS_SECTION_PATH;

            const slideContent = (
              <>
                <img
                  src={banner.image}
                  alt={banner.title?.trim() || `Banner ${i + 1}`}
                  className="absolute inset-0 w-full h-full object-contain object-center"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                />
                {hasText && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-950/85 via-brand-900/50 to-transparent sm:via-brand-900/40 pointer-events-none" />
                    <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-10 lg:px-14 max-w-xl pointer-events-none z-[1]">
                      {banner.title?.trim() && (
                        <h2 className="font-display text-lg sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-sm">
                          {banner.title}
                        </h2>
                      )}
                      {banner.subtitle?.trim() && (
                        <p className="mt-1 sm:mt-2 text-xs sm:text-lg text-brand-100/95 line-clamp-2">
                          {banner.subtitle}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </>
            );

            return (
              <div
                key={banner.id}
                className="hero-slide absolute inset-0 hero-slide-active z-10"
                aria-hidden={false}
              >
                <Link
                  to={linkTo}
                  className="block w-full h-full touch-manipulation cursor-pointer"
                  tabIndex={0}
                  aria-label={banner.title?.trim() ? `${banner.title} — devam` : 'Devam'}
                >
                  {slideContent}
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-1.5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-brand-950/60 p-2.5 text-white backdrop-blur-sm touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center sm:left-4"
            aria-label="Önceki banner"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-1.5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-brand-950/60 p-2.5 text-white backdrop-blur-sm touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center sm:right-4"
            aria-label="Sonraki banner"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 sm:bottom-4 sm:gap-2">
            {active.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`rounded-full transition-all duration-300 touch-manipulation ${
                  i === index
                    ? 'h-2.5 w-7 sm:w-8 bg-accent-gold shadow-sm'
                    : 'h-2.5 w-2.5 bg-white/60 hover:bg-white/90'
                }`}
                aria-label={`Banner ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
