import {
  Clock,
  Building2,
  CheckCircle,
  Package,
  Truck,
  XCircle,
} from 'lucide-react';

/** Sipariş + kargo yaşam döngüsü */
export const ORDER_STATUS_META = {
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

export function isPendingStatus(status) {
  return status === 'pending_cod' || status === 'pending_iban_check';
}

/** Admin: mevcut duruma göre önerilen sonraki adımlar */
export function getAdminStatusActions(order) {
  const status = order?.status;
  const paymentMethod = order?.paymentMethod;
  const actions = [];

  if (isPendingStatus(status)) {
    actions.push({
      id: 'approve',
      label: paymentMethod === 'iban' && status === 'pending_iban_check' ? 'IBAN onayla' : 'Onayla',
      nextStatus: paymentMethod === 'iban' && status === 'pending_iban_check' ? 'iban_verified' : 'confirmed',
      variant: 'primary',
    });
    actions.push({ id: 'cancel', label: 'Reddet', nextStatus: 'cancelled', variant: 'danger' });
    return actions;
  }

  if (status === 'iban_verified' || status === 'confirmed') {
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
  { id: 'preparing', label: 'Hazırlanıyor' },
  { id: 'shipping', label: 'Kargoda' },
  { id: 'completed', label: 'Teslim' },
  { id: 'cancelled', label: 'İptal' },
];

export function matchesStatusFilter(order, filterId) {
  const s = order?.status;
  if (filterId === 'all') return true;
  if (filterId === 'pending') return isPendingStatus(s);
  if (filterId === 'preparing') return s === 'confirmed' || s === 'iban_verified';
  if (filterId === 'shipping') return s === 'shipped';
  if (filterId === 'completed') return s === 'completed';
  if (filterId === 'cancelled') return s === 'cancelled';
  if (filterId === 'iban') return order?.paymentMethod === 'iban';
  if (filterId === 'cod') return order?.paymentMethod === 'cod';
  return true;
}
