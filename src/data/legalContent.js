/** Yasal metinler — Nasyonel Toys */

const COMPANY = 'Nasyonel Toys';
const EMAIL = 'info@nasyoneltoys.com';
const PHONE = '+90 850 305 81 34';

export const LEGAL_PAGES = {
  'mesafeli-satis': {
    title: 'Mesafeli Satış Sözleşmesi',
    sections: [
      {
        heading: '1. Taraflar',
        body: `Satıcı: ${COMPANY}. Alıcı, siteden sipariş veren gerçek veya tüzel kişidir. İletişim: ${EMAIL}, ${PHONE}.`,
      },
      {
        heading: '2. Konu',
        body: 'İşbu sözleşme, alıcının satıcıya ait internet sitesi üzerinden elektronik ortamda siparişini verdiği ürünlerin satışı ve teslimine ilişkin tarafların hak ve yükümlülüklerini düzenler.',
      },
      {
        heading: '3. Ürün ve fiyat',
        body: 'Ürün özellikleri ve fiyatlar sipariş anındaki sitede yer alan bilgiler esas alınır. Kampanya ve indirimler sipariş özetinde gösterilir.',
      },
      {
        heading: '4. Ödeme ve teslimat',
        body: 'Ödeme havale/EFT (IBAN) veya kapıda ödeme ile yapılabilir. Teslimat süresi stok ve kargo yoğunluğuna göre değişir; tahmini süre sipariş onayı sonrası bildirilir.',
      },
      {
        heading: '5. Cayma hakkı',
        body: 'Tüketici, ürünü teslim aldığı tarihten itibaren 14 gün içinde cayma hakkını kullanabilir. İade koşulları İptal & İade Politikası sayfasında açıklanmıştır.',
      },
    ],
  },
  'iade-iptal': {
    title: 'İptal & İade Politikası',
    sections: [
      {
        heading: 'İade süresi',
        body: 'Ürünü teslim aldıktan sonra 14 iş günü içinde iade talebinde bulunabilirsiniz. Ürün kullanılmamış, orijinal ambalajında ve faturasıyla birlikte olmalıdır.',
      },
      {
        heading: 'İade süreci',
        body: `İade talebi için ${EMAIL} adresine sipariş numaranızı yazın. Onay sonrası kargo bilgisi paylaşılır. İade kargo ücreti, ayıplı/yanlış ürün hariç alıcıya aittir.`,
      },
      {
        heading: 'İade edilemeyecek ürünler',
        body: 'Hijyen ürünleri, kişiye özel üretilen ürünler ve ambalajı açılmış sarf malzemeleri iade kapsamı dışında olabilir.',
      },
      {
        heading: 'İptal',
        body: 'Kargoya verilmeden önce sipariş iptali için müşteri hizmetleri ile iletişime geçin. Kargoya verilen siparişlerde iade prosedürü uygulanır.',
      },
    ],
  },
  gizlilik: {
    title: 'Gizlilik Politikası',
    sections: [
      {
        heading: 'Toplanan veriler',
        body: 'Sipariş için ad, telefon, e-posta, teslimat adresi; site kullanımında çerez ve analitik veriler toplanabilir.',
      },
      {
        heading: 'Kullanım amacı',
        body: 'Siparişin işlenmesi, teslimat, müşteri desteği, yasal yükümlülükler ve site güvenliği için kullanılır.',
      },
      {
        heading: 'Paylaşım',
        body: 'Veriler yalnızca kargo firması ve yasal zorunluluk hallerinde yetkili kurumlarla paylaşılır; üçüncü taraflara satılmaz.',
      },
    ],
  },
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    sections: [
      {
        heading: 'Veri sorumlusu',
        body: `${COMPANY} (${EMAIL}) 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusudur.`,
      },
      {
        heading: 'İşleme amaçları',
        body: 'Kimlik, iletişim ve sipariş verileriniz; sözleşmenin kurulması, sipariş takibi, müşteri ilişkileri ve meşru menfaat kapsamında işlenir.',
      },
      {
        heading: 'Haklarınız',
        body: 'KVKK md. 11 kapsamında bilgi talep etme, düzeltme, silme, itiraz ve şikâyet haklarınızı kullanabilirsiniz.',
      },
    ],
  },
  cerez: {
    title: 'Çerez Politikası',
    sections: [
      {
        heading: 'Çerezler',
        body: 'Sitemiz zorunlu çerezler ve performans/analitik çerezleri kullanabilir. Tarayıcı ayarlarından çerezleri yönetebilirsiniz.',
      },
    ],
  },
  'on-bilgilendirme': {
    title: 'Ön Bilgilendirme Formu',
    sections: [
      {
        heading: 'Satıcı bilgileri',
        body: `${COMPANY} — ${EMAIL} — ${PHONE}`,
      },
      {
        heading: 'Ürün ve toplam bedel',
        body: 'Sipariş özetinde ürün adı, adet, birim fiyat, ara toplam, kargo ve indirimler ayrıca gösterilir. Ödeme yöntemine göre nihai tutar değişebilir.',
      },
      {
        heading: 'Teslimat',
        body: '750 TL ve üzeri siparişlerde kargo ücretsizdir. Altındaki siparişlerde kargo ücreti sepet özetinde belirtilir.',
      },
    ],
  },
};
