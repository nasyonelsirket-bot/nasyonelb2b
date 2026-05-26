import { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { runAfterInteraction } from '@/utils/deferIdle';
import { initMetaPixel } from '@/lib/analytics/meta';
import { resolveMetaPixelId } from '@/lib/analytics/metaConfig';

/** Meta (Facebook) Pixel bootstrap — event tracking meta.js üzerinden */
export default function MetaPixel() {
  const { settings } = useStore();
  const pixelId = resolveMetaPixelId(settings?.metaPixelId);

  useEffect(() => {
    if (!pixelId) return;
    runAfterInteraction(() => initMetaPixel(pixelId));
  }, [pixelId]);

  return null;
}
