import { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';

export default function Analytics() {
  const { settings } = useStore();
  const gaId = settings.gaId || import.meta.env.VITE_GA_ID;
  const pixelId = settings.metaPixelId || import.meta.env.VITE_META_PIXEL_ID;

  useEffect(() => {
    if (!gaId) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', gaId);

    return () => {
      document.querySelector(`script[src*="googletagmanager"]`)?.remove();
    };
  }, [gaId]);

  useEffect(() => {
    if (!pixelId) return;

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

    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`;
    document.body.appendChild(noscript);
  }, [pixelId]);

  return null;
}
