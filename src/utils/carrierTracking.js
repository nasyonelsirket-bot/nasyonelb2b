/**
 * Kargo firması + takip numarasından müşteri takip URL'si
 */
export function getCarrierTrackingUrl(carrier, trackingNumber) {
  const no = String(trackingNumber || '').trim();
  if (!no) return null;

  const c = String(carrier || '').toLocaleLowerCase('tr');

  if (c.includes('yurtiçi') || c.includes('yurtici')) {
    return `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${encodeURIComponent(no)}`;
  }
  if (c.includes('aras')) {
    return `https://www.araskargo.com.tr/trmweb/kargotakip.aspx?kargotakipno=${encodeURIComponent(no)}`;
  }
  if (c.includes('mng')) {
    return `https://www.mngkargo.com.tr/gonderi-takip?code=${encodeURIComponent(no)}`;
  }
  if (c.includes('ptt')) {
    return `https://gonderitakip.ptt.gov.tr/`;
  }
  if (c.includes('sürat') || c.includes('surat')) {
    return `https://www.suratkargo.com.tr/KargoTakip/?kargotakipno=${encodeURIComponent(no)}`;
  }

  const q = encodeURIComponent(`${carrier || 'kargo'} ${no} takip`);
  return `https://www.google.com/search?q=${q}`;
}

export function canTrackShipment(order) {
  return Boolean(
    order?.trackingNumber?.trim() &&
      ['shipped', 'completed'].includes(order?.status),
  );
}
