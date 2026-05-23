import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function getFocusable(container) {
  if (!container) return [];
  return [...container.querySelectorAll(FOCUSABLE)].filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
  );
}

/**
 * Dialog / drawer: Escape, focus trap, focus restore.
 * @param {{ open: boolean, onClose: () => void, containerRef: import('react').RefObject<HTMLElement|null>, returnFocusRef?: import('react').RefObject<HTMLElement|null> }} options
 */
export default function useDialogA11y({ open, onClose, containerRef, returnFocusRef }) {
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement;
    const container = containerRef?.current;
    const focusable = getFocusable(container);
    if (focusable[0]) {
      requestAnimationFrame(() => focusable[0].focus());
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !container) return;

      const items = getFocusable(container);
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const returnEl = returnFocusRef?.current || previousFocusRef.current;
      if (returnEl && typeof returnEl.focus === 'function') {
        returnEl.focus();
      }
    };
  }, [open, onClose, containerRef, returnFocusRef]);
}
