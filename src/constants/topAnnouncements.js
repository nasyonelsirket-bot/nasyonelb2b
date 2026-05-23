import { FREE_SHIPPING_THRESHOLD_TL } from '@/utils/cartShipping';

/** Üst turuncu şerit — dönen duyurular */
export const TOP_ANNOUNCEMENTS = [
  {
    highlight: `${FREE_SHIPPING_THRESHOLD_TL} TL ve Üzeri Ücretsiz Kargo`,
    rest: 'Tüm siparişlerinizde geçerli ·',
  },
  {
    highlight: '14 İş Günü İade Hakkı',
    rest: 'Yasal süre içinde iade ve cayma ·',
  },
  {
    highlight: 'Güvenli Kart Ödemesi',
    rest: 'PayTR altyapısı ile 256-bit SSL ·',
  },
  {
    highlight: 'Eğitici Oyuncak Koleksiyonu',
    rest: 'Güvenilir tedarik · hızlı sevkiyat ·',
  },
  {
    highlight: '%5 Sepet İndirimi',
    rest: `${FREE_SHIPPING_THRESHOLD_TL} TL üzeri uyumlu ürün önerilerinde ·`,
  },
  {
    highlight: 'Çok Satan Ürünler',
    rest: 'Trendyol satış verilerine dayalı sıralama ·',
  },
  {
    highlight: 'Ücretsiz Üyelik',
    rest: 'Sipariş takibi ve adres yönetimi ·',
  },
];

export const ANNOUNCEMENT_ROTATE_MS = 4200;
