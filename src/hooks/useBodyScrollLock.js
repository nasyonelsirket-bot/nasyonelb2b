import { useEffect } from 'react';

/** Menü/drawer açıkken arka plan scroll'unu kilitle */
export default function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return undefined;

    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = prev;
    };
  }, [locked]);
}
