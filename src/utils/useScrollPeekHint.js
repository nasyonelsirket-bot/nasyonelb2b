import { useEffect } from 'react';

const MOBILE_QUERY = '(max-width: 768px)';
const PEEK_DURATION_MS = 1000;
const PEEK_DELAY_MS = 400;
const PEEK_DISTANCE_PX = 50;
const MIN_SCROLLABLE_PX = 32;
const MIN_PEEK_PX = 24;

const peekedElements = new WeakSet();
const peekQueue = [];
let peekRunning = false;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function isElementVisible(el) {
  const rect = el.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight;
}

function setHorizontalScroll(el, left) {
  el.scrollTop = 0;
  el.scrollLeft = left;
}

function lockPageScroll() {
  document.documentElement.classList.add('peek-scroll-lock');
  return () => {
    document.documentElement.classList.remove('peek-scroll-lock');
  };
}

function runPeekTask(task) {
  return new Promise((resolve) => {
    peekQueue.push(() => task(resolve));
    drainPeekQueue();
  });
}

function drainPeekQueue() {
  if (peekRunning || peekQueue.length === 0) return;
  peekRunning = true;

  const next = peekQueue.shift();
  next(() => {
    peekRunning = false;
    drainPeekQueue();
  });
}

/**
 * Mobilde yatay ürün slider'ına tek seferlik scrollLeft peek animasyonu.
 * Sadece slider container hareket eder; sayfa dikey scroll'u etkilenmez.
 */
export function useScrollPeekHint(ref, { enabled = true, ready = true } = {}) {
  useEffect(() => {
    if (!enabled || !ready) return undefined;

    const el = ref.current;
    if (!el || peekedElements.has(el)) return undefined;

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
    let unlockPage = null;
    let savedStyles = null;

    const restoreElementStyles = () => {
      if (!savedStyles) return;
      el.style.scrollBehavior = savedStyles.scrollBehavior;
      el.style.scrollSnapType = savedStyles.scrollSnapType;
      el.style.overflowAnchor = savedStyles.overflowAnchor;
      el.style.overscrollBehavior = savedStyles.overscrollBehavior;
      el.style.touchAction = savedStyles.touchAction;
      if (savedStyles.hadScrollSmooth) {
        el.classList.add('scroll-smooth');
      } else {
        el.classList.remove('scroll-smooth');
      }
      savedStyles = null;
    };

    const releasePageLock = () => {
      unlockPage?.();
      unlockPage = null;
    };

    const cleanupListeners = () => {
      el.removeEventListener('touchstart', cancel, true);
      el.removeEventListener('pointerdown', cancel, true);
    };

    const teardown = () => {
      cancelAnimationFrame(rafId);
      clearTimeout(delayId);
      observer?.disconnect();
      observer = null;
      cleanupListeners();
      setHorizontalScroll(el, 0);
      restoreElementStyles();
      releasePageLock();
    };

    const cancel = () => {
      if (cancelled) return;
      cancelled = true;
      teardown();
    };

    const runPeek = () =>
      runPeekTask((done) => {
        if (cancelled || !el.isConnected || !isElementVisible(el)) {
          done();
          return;
        }

        peekedElements.add(el);
        unlockPage = lockPageScroll();

        savedStyles = {
          scrollBehavior: el.style.scrollBehavior,
          scrollSnapType: el.style.scrollSnapType,
          overflowAnchor: el.style.overflowAnchor,
          overscrollBehavior: el.style.overscrollBehavior,
          touchAction: el.style.touchAction,
          hadScrollSmooth: el.classList.contains('scroll-smooth'),
        };

        el.classList.remove('scroll-smooth');
        el.style.scrollBehavior = 'auto';
        el.style.scrollSnapType = 'none';
        el.style.overflowAnchor = 'none';
        el.style.overscrollBehavior = 'none contain';
        el.style.touchAction = 'pan-x';

        setHorizontalScroll(el, 0);

        let startTime = 0;

        const finish = () => {
          setHorizontalScroll(el, 0);
          restoreElementStyles();
          releasePageLock();
          cleanupListeners();
          done();
        };

        const step = (timestamp) => {
          if (cancelled) {
            finish();
            return;
          }

          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / PEEK_DURATION_MS, 1);

          let offset;
          if (progress <= 0.5) {
            offset = easeInOutCubic(progress / 0.5) * peekPx;
          } else {
            offset = peekPx * (1 - easeInOutCubic((progress - 0.5) / 0.5));
          }

          setHorizontalScroll(el, offset);

          if (progress < 1) {
            rafId = requestAnimationFrame(step);
            return;
          }

          cancelled = true;
          finish();
        };

        rafId = requestAnimationFrame(step);
      });

    const schedulePeek = () => {
      if (cancelled || peekedElements.has(el)) return;
      delayId = window.setTimeout(() => {
        runPeek();
      }, PEEK_DELAY_MS);
    };

    observer = new IntersectionObserver(
      (entries) => {
        if (cancelled || peekedElements.has(el) || !entries[0]?.isIntersecting) return;
        observer.disconnect();
        observer = null;
        schedulePeek();
      },
      { threshold: 0.4, root: null },
    );

    observer.observe(el);

    el.addEventListener('touchstart', cancel, { passive: true, capture: true });
    el.addEventListener('pointerdown', cancel, { capture: true });

    return cancel;
  }, [ref, enabled, ready]);
}
