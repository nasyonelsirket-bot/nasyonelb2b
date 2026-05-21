/** Admin sipariş red — hazır iptal nedenleri */

export const ORDER_CANCEL_PRESETS = [
  { id: 'expensive', label: 'Müşteri pahalı buldu' },
  { id: 'wrong_address', label: 'Yanlış adres / teslimat bilgisi' },
  { id: 'wrong_product', label: 'Yanlış ürün seçti' },
  { id: 'customer_cancel', label: 'Müşteri siparişi iptal etmek istedi' },
  { id: 'payment_failed', label: 'Ödeme alınamadı / dekont uyuşmuyor' },
  { id: 'out_of_stock', label: 'Ürün stokta yok' },
  { id: 'unreachable', label: 'Müşteriye ulaşılamadı' },
  { id: 'duplicate', label: 'Mükerrer / yanlışlıkla verilen sipariş' },
  { id: 'other', label: 'Diğer (aşağıya not yazın)' },
];
