import {
  Clock,
  Building2,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  CreditCard,
} from 'lucide-react';

/** Sipariş + kargo yaşam döngüsü */
export const ORDER_STATUS_META = {
  pending_payment: {
    label: 'Kart ödemesi bekleniyor',
    shortLabel: 'Ödeme bekliyor',
    phase: 'payment',
    color: 'text-amber-700 bg-amber-50',
    icon: CreditCard,
  },
  pending_iban_check: {
    label: 'IBAN ödemesi bekleniyor',
    shortLabel: 'Ödeme bekliyor',
    phase: 'payment',
    color: 'text-amber-700 bg-amber-50',
    icon: Building2,
  },
  pending_cod: {
    label: 'Sipariş onayı bekleniyor',
    shortLabel: 'Onay bekliyor',
    phase: 'order',
    color: 'text-orange-700 bg-orange-50',
    icon: Clock,
  },
  iban_verified: {
    label: 'Ödeme onaylandı — hazırlanıyor',
    shortLabel: 'Hazırlanıyor',
    phase: 'preparing',
    color: 'text-emerald-700 bg-emerald-50',
    icon: CheckCircle,
  },
  confirmed: {
    label: 'Onaylandı — hazırlanıyor',
    shortLabel: 'Hazırlanıyor',
    phase: 'preparing',
    color: 'text-emerald-700 bg-emerald-50',
    icon: CheckCircle,
  },
  kargoya_hazir: {
    label: 'Kargoya hazır',
    shortLabel: 'Kargoya hazır',
    phase: 'preparing',
    color: 'text-emerald-700 bg-emerald-50',
    icon: CheckCircle,
  },
  packed: {
    label: 'Paket yapıldı',
    shortLabel: 'Paket yapıldı',
    phase: 'packed',
    color: 'text-violet-700 bg-violet-50',
    icon: Package,
  },
  shipped: {
    label: 'Kargoya verildi',
    shortLabel: 'Kargoda',
    phase: 'shipping',
    color: 'text-blue-700 bg-blue-50',
    icon: Truck,
  },
  completed: {
    label: 'Teslim edildi',
    shortLabel: 'Teslim',
    phase: 'done',
    color: 'text-gray-700 bg-gray-100',
    icon: Package,
  },
  cancelled: {
    label: 'İptal / red',
    shortLabel: 'İptal',
    phase: 'cancelled',
    color: 'text-red-700 bg-red-50',
    icon: XCircle,
  },
};

export const STATUS_TR = Object.fromEntries(
  Object.entries(ORDER_STATUS_META).map(([k, v]) => [k, v.label]),
);

export function getStatusMeta(status) {
  return (
    ORDER_STATUS_META[status] || {
      label: status,
      shortLabel: status,
      phase: 'order',
      color: 'text-gray-600 bg-gray-100',
      icon: Clock,
    }
  );
}

/** Ödeme yapılmamış — admin Bekleyen sekmesi */
export function isUnpaidOrderStatus(status) {
  return status === 'pending_payment' || status === 'pending_iban_check' || status === 'pending_cod';
}

/** Kart ödemesi PayTR ekranında — sadece izleme, manuel onay yok */
export function isPaymentStageWaiting(status) {
  return status === 'pending_payment';
}

export function canAdminApprovePending(status) {
  return status === 'pending_iban_check' || status === 'pending_cod';
}

/** @deprecated isUnpaidOrderStatus kullanın */
export function isPendingStatus(status) {
  return isUnpaidOrderStatus(status);
}

export function formatPaymentMethod(method) {
  if (method === 'iban') return 'Havale / EFT';
  if (method === 'paytr') return 'Kart (PayTR)';
  if (method === 'cod') return 'Kapıda ödeme';
  return method || '—';
}

/** Admin: mevcut duruma göre önerilen sonraki adımlar */
export function getAdminStatusActions(order) {
  const status = order?.status;
  const paymentMethod = order?.paymentMethod;
  const actions = [];

  if (canAdminApprovePending(status)) {
    actions.push({
      id: 'approve',
      label: paymentMethod === 'iban' && status === 'pending_iban_check' ? 'IBAN onayla' : 'Onayla',
      nextStatus: paymentMethod === 'iban' && status === 'pending_iban_check' ? 'iban_verified' : 'kargoya_hazir',
      variant: 'primary',
    });
    actions.push({ id: 'cancel', label: 'Reddet', nextStatus: 'cancelled', variant: 'danger' });
    return actions;
  }

  if (status === 'iban_verified' || status === 'confirmed' || status === 'kargoya_hazir') {
    return actions;
  }

  if (status === 'packed') {
    actions.push({
      id: 'ship',
      label: 'Kargoya ver',
      nextStatus: 'shipped',
      variant: 'primary',
      needsShipping: true,
    });
  }

  if (status === 'shipped') {
    actions.push({
      id: 'complete',
      label: 'Teslim edildi',
      nextStatus: 'completed',
      variant: 'primary',
    });
    actions.push({
      id: 'ship_update',
      label: 'Kargo bilgisini güncelle',
      nextStatus: 'shipped',
      variant: 'secondary',
      needsShipping: true,
    });
  }

  return actions;
}

export const ADMIN_STATUS_FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'pending', label: 'Bekleyen' },
  { id: 'preparing', label: 'Kargoya hazır' },
  { id: 'packed', label: 'Paket yapıldı' },
  { id: 'shipping', label: 'Kargoda' },
  { id: 'completed', label: 'Teslim' },
  { id: 'cancelled', label: 'İptal' },
];

export const PAYMENT_METHOD_FILTERS = [
  { id: 'all', label: 'Tüm ödemeler' },
  { id: 'paytr', label: 'Kart (PayTR)' },
  { id: 'iban', label: 'Havale / EFT' },
  { id: 'cod', label: 'Kapıda ödeme' },
];

export function matchesStatusFilter(order, filterId) {
  const s = order?.status;
  if (filterId === 'all') return true;
  if (filterId === 'pending') return isUnpaidOrderStatus(s);
  if (filterId === 'preparing') return s === 'kargoya_hazir' || s === 'confirmed' || s === 'iban_verified';
  if (filterId === 'packed') return s === 'packed';
  if (filterId === 'shipping') return s === 'shipped';
  if (filterId === 'completed') return s === 'completed';
  if (filterId === 'cancelled') return s === 'cancelled';
  if (filterId === 'iban') return order?.paymentMethod === 'iban';
  if (filterId === 'cod') return order?.paymentMethod === 'cod';
  return true;
}
