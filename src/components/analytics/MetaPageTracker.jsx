import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackMetaPageView } from '@/lib/analytics/meta';
import { isMetaTrackablePath } from '@/lib/analytics/metaConfig';
import { captureAttribution } from '@/lib/analytics/ga4';

/** React Router SPA gezinmesinde Meta PageView (+ CAPI dedup) */
export default function MetaPageTracker() {
  const location = useLocation();
  const lastSent = useRef('');

  useEffect(() => {
    if (!isMetaTrackablePath(location.pathname)) return;

    const key = `${location.pathname}${location.search}${location.hash}`;
    if (lastSent.current === key) return;
    lastSent.current = key;

    captureAttribution();

    trackMetaPageView({
      pathname: location.pathname,
      page_location: window.location.href,
    });
  }, [location.pathname, location.search, location.hash]);

  return null;
}
