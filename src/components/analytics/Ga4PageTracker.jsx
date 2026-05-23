import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, captureAttribution } from '@/lib/analytics/ga4';
import { isGa4TrackablePath } from '@/lib/analytics/ga4Config';

/**
 * React Router SPA gezinmesinde page_view gönderir.
 */
export default function Ga4PageTracker() {
  const location = useLocation();
  const lastSent = useRef('');

  useEffect(() => {
    if (!isGa4TrackablePath(location.pathname)) return;

    const key = `${location.pathname}${location.search}${location.hash}`;
    if (lastSent.current === key) return;
    lastSent.current = key;

    captureAttribution();

    trackPageView({
      page_path: location.pathname + location.search + location.hash,
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [location.pathname, location.search, location.hash]);

  return null;
}
