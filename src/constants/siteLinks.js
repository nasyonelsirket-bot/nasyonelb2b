/** Ana sayfadaki ürün listesi bölümü */
export const PRODUCTS_SECTION_PATH = '/#urunler';

export const SOCIAL_HANDLE = 'nasyoneltoys';

export const INSTAGRAM_URL = 'https://www.instagram.com/nasyoneltoys/';
export const INSTAGRAM_HANDLE = SOCIAL_HANDLE;

export const FACEBOOK_URL = 'https://www.facebook.com/nasyoneltoys';
export const TIKTOK_URL = 'https://www.tiktok.com/@nasyoneltoys';
export const YOUTUBE_URL = 'https://www.youtube.com/@nasyoneltoys';

/** Footer ve header’da öne çıkan yasal linkler (PayTR / güven uyumu) */
export const FOOTER_PRIMARY_LEGAL = [
  { path: '/sozlesme/teslimat-kargo', label: 'Teslimat Koşulları' },
  { path: '/sozlesme/iade-iptal', label: 'İade Politikası' },
  { path: '/sozlesme/mesafeli-satis', label: 'Mesafeli Satış Sözleşmesi' },
  { path: '/sozlesme/kvkk', label: 'KVKK' },
  { path: '/iletisim', label: 'İletişim' },
];

/** Header’da kompakt yasal erişim */
export const HEADER_LEGAL_LINKS = FOOTER_PRIMARY_LEGAL.filter((l) => l.path !== '/iletisim');

export const LEGAL_ROUTES = [
  { path: '/sozlesme/teslimat-kargo', label: 'Teslimat ve Kargo Koşulları' },
  { path: '/sozlesme/iade-iptal', label: 'İade ve Değişim Politikası' },
  { path: '/sozlesme/mesafeli-satis', label: 'Mesafeli Satış Sözleşmesi' },
  { path: '/sozlesme/gizlilik', label: 'Gizlilik Politikası' },
  { path: '/sozlesme/kvkk', label: 'KVKK Aydınlatma Metni' },
  { path: '/sozlesme/on-bilgilendirme', label: 'Ön Bilgilendirme Formu' },
  { path: '/sozlesme/cerez', label: 'Çerez Politikası' },
];
