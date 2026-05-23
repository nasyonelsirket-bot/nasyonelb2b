import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { PRODUCTS_SECTION_PATH } from '@/constants/siteLinks';
import { optimizeBannerImage } from '@/utils/imageOptimize';

const AUTO_MS = 6500;
const SWIPE_THRESHOLD = 48;

function preloadHeroImage(src) {
  if (!src || typeof document === 'undefined') return undefined;
  const href = optimizeBannerImage(src);
  const existing = document.querySelector(`link[data-hero-preload="${href}"]`);
  if (existing) return undefined;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = href;
  link.setAttribute('data-hero-preload', href);
  document.head.appendChild(link);

  return () => {
    link.remove();
  };
}

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
    const picked = ids.map((id) => byId.get(id)).filter(Boolean);
    // Ayarlardaki ID'ler henüz yüklenmemiş banner'larla eşleşmezse tüm aktif bannerları göster
    return picked.length ? picked : allActive;
  }, [allActive, bannerIds]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState(true);
  const touchStart = useRef(null);

  const count = active.length;
  const current = active[index];
  const currentSrc = current?.image ? optimizeBannerImage(current.image) : '';

  const go = useCallback(
    (delta) => {
      if (count <= 1) return;
      setIndex((i) => (i + delta + count) % count);
      setLoaded(false);
    },
    [count],
  );

  useEffect(() => {
    setIndex((i) => (count ? Math.min(i, count - 1) : 0));
  }, [count]);

  useEffect(() => {
    if (!active[0]?.image) return undefined;
    return preloadHeroImage(active[0].image);
  }, [active]);

  useEffect(() => {
    if (!currentSrc || typeof window === 'undefined') return;
    const img = new window.Image();
    img.src = currentSrc;
    if (img.complete) setLoaded(true);
  }, [currentSrc]);

  useEffect(() => {
    if (count <= 1 || paused) return undefined;
    const t = window.setInterval(() => go(1), AUTO_MS);
    return () => window.clearInterval(t);
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

  const onKeyDown = (e) => {
    if (count <= 1) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    }
  };

  if (!count || !current) return null;

  const hasText = Boolean(current.title?.trim() || current.subtitle?.trim());
  const linkTo = current.link?.trim() || PRODUCTS_SECTION_PATH;

  return (
    <section
      className="hero-carousel relative mx-2 mt-3 sm:mx-6 sm:mt-6 lg:mx-auto lg:max-w-7xl lg:px-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-label="Kampanya bannerları"
      aria-roledescription="carousel"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {count > 1
          ? `Banner ${index + 1} / ${count}${current.title?.trim() ? `: ${current.title}` : ''}`
          : ''}
      </p>
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-xl ring-1 ring-white/10 bg-brand-950">
        <div className="hero-banner-frame relative w-full">
          <div className="hero-slide absolute inset-0 z-10">
            <Link
              to={linkTo}
              className="block w-full h-full touch-manipulation cursor-pointer"
              tabIndex={0}
              aria-label={current.title?.trim() ? `${current.title} — devam` : 'Devam'}
            >
              {!loaded && (
                <div
                  className="absolute inset-0 animate-pulse bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900"
                  aria-hidden
                />
              )}
              <img
                src={currentSrc}
                alt={current.title?.trim() || 'Kampanya bannerı'}
                className={`hero-banner-img absolute inset-0 w-full h-full object-contain object-center transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                width={1280}
                height={533}
                draggable={false}
                onLoad={() => setLoaded(true)}
                onError={() => setLoaded(true)}
              />
              {hasText && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-950/85 via-brand-900/50 to-transparent sm:via-brand-900/40 pointer-events-none" />
                  <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-10 lg:px-14 max-w-xl pointer-events-none z-[1]">
                    {current.title?.trim() && (
                      <p className="font-display text-lg sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-sm">
                        {current.title}
                      </p>
                    )}
                    {current.subtitle?.trim() && (
                      <p className="mt-1 sm:mt-2 text-xs sm:text-lg text-brand-100/95 line-clamp-2">
                        {current.subtitle}
                      </p>
                    )}
                  </div>
                </>
              )}
            </Link>
          </div>
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
                onClick={() => {
                  setIndex(i);
                  setLoaded(false);
                }}
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
