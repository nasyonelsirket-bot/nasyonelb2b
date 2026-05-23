import { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { runAfterInteraction } from '@/utils/deferIdle';

/** Meta (Facebook) Pixel — GA4'ten ayrı tutuldu */
export default function MetaPixel() {
  const { settings } = useStore();
  const pixelId = settings.metaPixelId || import.meta.env.VITE_META_PIXEL_ID;

  useEffect(() => {
    if (!pixelId) return;

    runAfterInteraction(() => {
      if (window.fbq) return;

      const n = (window.fbq = function (...args) {
        n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
      });
      if (!window._fbq) window._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];

      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);

      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');

      const img = document.createElement('img');
      img.height = 1;
      img.width = 1;
      img.style.display = 'none';
      img.alt = '';
      img.src = `https://www.facebook.com/tr?id=${encodeURIComponent(pixelId)}&ev=PageView&noscript=1`;
      const noscript = document.createElement('noscript');
      noscript.appendChild(img);
      document.body.appendChild(noscript);
    });
  }, [pixelId]);

  return null;
}
