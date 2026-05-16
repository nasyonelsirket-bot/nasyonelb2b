import { formatPrice } from '@/utils/whatsapp';

export const DEFAULT_MIN_LINE_VALUE_TL = 2000;

/** Ürün başına minimum adet: max(manuel minOrder, ⌈minTutar/fiyat⌉) */
export function resolveMinQuantity(product, minLineValue = DEFAULT_MIN_LINE_VALUE_TL) {
  const price = Number(product?.price) || 0;
  const explicitQty = Math.max(1, parseInt(product?.minOrder, 10) || 1);
  if (price <= 0) return explicitQty;
  const qtyByValue = Math.ceil(minLineValue / price);
  return Math.max(explicitQty, qtyByValue, 1);
}

export function getMinOrderInfo(product, minLineValue = DEFAULT_MIN_LINE_VALUE_TL) {
  const minQty = resolveMinQuantity(product, minLineValue);
  const price = Number(product?.price) || 0;
  const lineTotalAtMin = price * minQty;
  return {
    minQty,
    minLineValue,
    lineTotalAtMin,
    label: `Min. ${minQty} adet (${formatPrice(lineTotalAtMin)})`,
    shortLabel: `${minQty} adet · min ${formatPrice(minLineValue)}`,
  };
}

export function isLineValid(item, minLineValue = DEFAULT_MIN_LINE_VALUE_TL) {
  const minQty = resolveMinQuantity(item, minLineValue);
  if (item.quantity < minQty) return false;
  return item.price * item.quantity >= minLineValue - 0.01;
}
