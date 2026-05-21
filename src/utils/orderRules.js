/** Perakende: minimum sipariş kuralı yok — her zaman 1 adet */
export function resolveMinQuantity() {
  return 1;
}

export function getMinOrderInfo() {
  return { minQty: 1, label: '', shortLabel: '' };
}

export function isLineValid(item) {
  return (item?.quantity || 0) >= 1;
}
