import { useEffect } from 'react';

/**
 * Yatay kaydırma alanında dikey sayfa kaydırmasını kilitlemez.
 * İlk hareket yönüne göre pan-x veya pan-y uygular.
 */
export function useAxisScrollLock(ref) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const state = { startX: 0, startY: 0, axis: null };

    const reset = () => {
      state.axis = null;
      node.style.touchAction = '';
    };

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      state.startX = t.clientX;
      state.startY = t.clientY;
      state.axis = null;
      node.style.touchAction = '';
    };

    const onTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - state.startX;
      const dy = t.clientY - state.startY;

      if (!state.axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        state.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }

      node.style.touchAction = state.axis === 'x' ? 'pan-x' : 'pan-y';
    };

    node.addEventListener('touchstart', onTouchStart, { passive: true });
    node.addEventListener('touchmove', onTouchMove, { passive: true });
    node.addEventListener('touchend', reset, { passive: true });
    node.addEventListener('touchcancel', reset, { passive: true });

    return () => {
      reset();
      node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener('touchmove', onTouchMove);
      node.removeEventListener('touchend', reset);
      node.removeEventListener('touchcancel', reset);
    };
  }, [ref]);
}
