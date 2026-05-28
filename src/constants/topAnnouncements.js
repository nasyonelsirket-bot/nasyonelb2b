import { FREE_SHIPPING_LABEL, HIGH_VALUE_DISCOUNT_THRESHOLD_TL } from '@/constants/commerceCopy';

export const ANNOUNCEMENT_ROTATE_MS = 6500;

export const TOP_ANNOUNCEMENTS = [
  {
    id: 'free-ship',
    highlight: FREE_SHIPPING_LABEL,
    rest: ' — Sepete özel ücretsiz kargo fırsatı',
    href: '/kategoriler',
  },
  {
    id: 'secure-pay',
    highlight: 'Güvenli Ödeme',
    rest: ' — PayTR ile 256 bit SSL korumalı alışveriş',
    href: '/sepet',
  },
  {
    id: 'hv-discount',
    highlight: `%${5} Ekstra İndirim`,
    rest: ` — ${HIGH_VALUE_DISCOUNT_THRESHOLD_TL} TL üzeri alışverişlerde otomatik`,
    href: '/en-cok-satanlar',
  },
];
