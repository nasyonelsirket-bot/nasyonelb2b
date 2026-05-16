/** Ürün başına minimum sipariş adedi (ürün kaydındaki minOrder) */
export function resolveMinQuantity(product) {
  return Math.max(1, parseInt(product?.minOrder, 10) || 1);
}

export function getMinOrderInfo(product) {
  const minQty = resolveMinQuantity(product);
  return {
    minQty,
    label: `Min. ${minQty} adet`,
    shortLabel: `Min. ${minQty} adet`,
  };
}

export function isLineValid(item) {
  const minQty = resolveMinQuantity(item);
  return item.quantity >= minQty;
}
