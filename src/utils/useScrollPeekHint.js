import { useEffect } from 'react';

const MOBILE_QUERY = '(max-width: 768px)';
const PEEK_DURATION_MS = 1000;
const PEEK_DELAY_MS = 350;
const PEEK_DISTANCE_PX = 50;
const MIN_SCROLLABLE_PX = 32;
const MIN_PEEK_PX = 24;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Mobilde yatay kaydırma alanına tek seferlik hafif "peek" animasyonu verir.
 * Native scrollLeft kullanır; scroll-snap ve dokunma davranışı korunur.
 */
export function useScrollPeekHint(ref, { enabled = true, ready = true } = {}) {
  useEffect(() => {
    if (!enabled || !ready) return undefined;

    const el = ref.current;
    if (!el) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (!window.matchMedia(MOBILE_QUERY).matches) return undefined;

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll < MIN_SCROLLABLE_PX) return undefined;

    const peekPx = Math.min(PEEK_DISTANCE_PX, maxScroll);
    if (peekPx < MIN_PEEK_PX) return undefined;

    let cancelled = false;
    let rafId = 0;
    let delayId = 0;
    let observer = null;
    let previousBehavior = '';

    const cleanupListeners = () => {
      el.removeEventListener('touchstart', cancel, true);
      el.removeEventListener('pointerdown', cancel, true);
      el.removeEventListener('wheel', cancel, true);
    };

    const restoreScrollBehavior = () => {
      el.style.scrollBehavior = previousBehavior;
    };

    const stop = () => {
      if (cancelled) return;
      cancelled = true;
      cancelAnimationFrame(rafId);
      clearTimeout(delayId);
      observer?.disconnect();
      cleanupListeners();
      restoreScrollBehavior();
    };

    const cancel = () => {
      stop();
    };

    const runPeek = () => {
      if (cancelled) return;

      previousBehavior = el.style.scrollBehavior;
      el.style.scrollBehavior = 'auto';

      let startTime = 0;

      const step = (timestamp) => {
        if (cancelled) return;

        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / PEEK_DURATION_MS, 1);

        let offset;
        if (progress <= 0.5) {
          offset = easeInOutCubic(progress / 0.5) * peekPx;
        } else {
          offset = peekPx * (1 - easeInOutCubic((progress - 0.5) / 0.5));
        }

        el.scrollLeft = offset;

        if (progress < 1) {
          rafId = requestAnimationFrame(step);
          return;
        }

        el.scrollLeft = 0;
        stop();
      };

      rafId = requestAnimationFrame(step);
    };

    const schedulePeek = () => {
      if (cancelled) return;
      delayId = window.setTimeout(runPeek, PEEK_DELAY_MS);
    };

    observer = new IntersectionObserver(
      (entries) => {
        if (cancelled || !entries[0]?.isIntersecting) return;
        observer.disconnect();
        observer = null;
        schedulePeek();
      },
      { threshold: 0.35, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(el);

    el.addEventListener('touchstart', cancel, { passive: true, capture: true });
    el.addEventListener('pointerdown', cancel, { capture: true });
    el.addEventListener('wheel', cancel, { passive: true, capture: true });

    return cancel;
  }, [ref, enabled, ready]);
}
