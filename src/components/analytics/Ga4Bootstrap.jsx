import { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { initGa4 } from '@/lib/analytics/ga4';
import { resolveMeasurementId } from '@/lib/analytics/ga4Config';

/**
 * GA4 script yüklemesi — ölçüm kimliği env, admin ayarı veya varsayılandan gelir.
 */
export default function Ga4Bootstrap() {
  const { settings } = useStore();
  const measurementId = resolveMeasurementId(settings?.gaId);

  useEffect(() => {
    if (!measurementId) return;
    initGa4(measurementId);
  }, [measurementId]);

  return null;
}
