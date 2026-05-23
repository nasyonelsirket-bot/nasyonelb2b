/** Yasal metinler — Nasyonel Toys */

const COMPANY = 'Nasyonel Toys';
const BRAND = 'nasyoneltoys';
const EMAIL = 'info@nasyoneltoys.com';
const PHONE = '+90 850 305 81 34';
const FREE_SHIPPING_MIN = 500;
const RETURN_DAYS = 14;

const BRAND_INTRO =
  'Nasyonel Toys olarak eğitici ve eğlenceli oyuncakları güvenli alışveriş, hızlı kargo ve kolay iade anlayışıyla sunuyoruz. Aşağıdaki metinler, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında hazırlanmıştır.';

export const LEGAL_PAGES = {
  'mesafeli-satis': {
    title: 'Mesafeli Satış Sözleşmesi',
    intro: BRAND_INTRO,
    highlights: [
      'Güvenli ödeme: kredi ve banka kartı (PayTR)',
      `${FREE_SHIPPING_MIN} TL ve üzeri siparişlerde ücretsiz kargo`,
      `${RETURN_DAYS} iş günü içinde cayma ve iade hakkı`,
    ],
    sections: [
      {
        heading: '1. Taraflar ve iletişim',
        paragraphs: [
          `Satıcı: ${COMPANY} (${BRAND}). Alıcı, www.nasyoneltoys.com üzerinden sipariş veren gerçek veya tüzel kişidir.`,
          `Sipariş, ödeme ve teslimat süreçlerinde destek için ${EMAIL} e-posta adresi ve ${PHONE} telefon hattımızdan bize ulaşabilirsiniz.`,
        ],
      },
      {
        heading: '2. Sözleşmenin konusu',
        paragraphs: [
          'İşbu sözleşme; alıcının elektronik ortamda verdiği sipariş kapsamında ürünlerin satışı, bedelin ödenmesi, teslimatı ve tarafların hak ile yükümlülüklerini düzenler.',
          'Sipariş onayı, ödeme onayı veya kargo bildirimi ayrı ayrı bilgilendirme niteliğindedir; sözleşme siparişin satıcı tarafından onaylanmasıyla kurulmuş sayılır.',
        ],
      },
      {
        heading: '3. Ürünler, fiyat ve kampanyalar',
        paragraphs: [
          'Ürünün temel nitelikleri, satış fiyatı, KDV ve varsa ek masraflar sipariş özetinde ve ürün sayfasında gösterilir.',
          'Kampanya, indirim ve kupon uygulamaları sipariş anındaki koşullara tabidir. Stok tükenmesi halinde alıcı bilgilendirilir; ücret iadesi veya eşdeğer ürün sunumu değerlendirilir.',
        ],
        bullets: [
          'Fiyatlar Türk Lirası (TL) cinsinden belirtilir.',
          'Görsel ve açıklamalar bilgilendirme amaçlıdır; renk tonu ekran ayarına göre küçük farklılık gösterebilir.',
        ],
      },
      {
        heading: '4. Ödeme yöntemleri',
        paragraphs: [
          'Ödeme; kredi veya banka kartı ile PayTR güvenli ödeme altyapısı üzerinden yapılır. Ödeme onayı sonrası hazırlık süreci başlar.',
        ],
        bullets: [
          'Kart bilgileriniz PayTR tarafından işlenir; sitemizde saklanmaz.',
          '3D Secure ve güvenli bağlantı (SSL) ile korunursunuz.',
        ],
      },
      {
        heading: '5. Teslimat ve kargo',
        paragraphs: [
          `Teslimat süresi stok durumu, adres ve kargo yoğunluğuna göre değişir. ${FREE_SHIPPING_MIN} TL ve üzeri siparişlerde kargo bedeli alıcıya yansıtılmaz.`,
          'Kargo firması ve takip numarası sipariş kargoya verildiğinde e-posta veya sipariş takip ekranı üzerinden paylaşılır.',
        ],
      },
      {
        heading: '6. Cayma hakkı',
        paragraphs: [
          `Tüketici, ürünü teslim aldığı tarihten itibaren ${RETURN_DAYS} gün içinde hiçbir gerekçe göstermeksizin cayma hakkını kullanabilir.`,
          'Cayma hakkının kullanımına ilişkin ayrıntılı süreç İptal & İade Politikası sayfasında açıklanmıştır.',
        ],
      },
      {
        heading: '7. Uyuşmazlık',
        paragraphs: [
          'Tüketici şikâyet ve itirazları için Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir. Şikâyetleriniz için öncelikle müşteri hizmetlerimizle iletişime geçmenizi rica ederiz.',
        ],
      },
    ],
  },
  'iade-iptal': {
    title: 'İade ve Değişim Politikası',
    intro:
      'Alışverişinizden memnun kalmamanız halinde kolay ve şeffaf bir iade süreci sunuyoruz. Ürünü teslim aldıktan sonra 14 iş günü içinde iade talebinde bulunabilirsiniz.',
    highlights: [
      `${RETURN_DAYS} iş günü içinde iade hakkı`,
      'Orijinal ambalaj ve fatura ile kolay süreç',
      'Ayıplı veya yanlış ürünlerde kargo masrafı satıcıya aittir',
    ],
    sections: [
      {
        heading: 'İade süresi ve koşullar',
        paragraphs: [
          `Ürünü teslim aldığınız tarihten itibaren ${RETURN_DAYS} iş günü içinde iade talebinde bulunabilirsiniz.`,
          'İade edilecek ürün; kullanılmamış, eksiksiz, orijinal ambalajında ve satış faturası veya sipariş belgesi ile birlikte olmalıdır.',
        ],
        bullets: [
          'Ürün üzerinde kullanım izi, kırık parça veya eksik aksesuar bulunmamalıdır.',
          'Hediye paketi veya promosyon ürünleri de set halinde iade edilmelidir.',
        ],
      },
      {
        heading: 'İade süreci — adım adım',
        paragraphs: [
          `1. ${EMAIL} adresine sipariş numaranızı ve iade nedeninizi yazın.`,
          '2. Müşteri temsilcimiz talebinizi onaylar ve size kargo/iade adres bilgisini iletir.',
          '3. Ürünü belirtilen şekilde paketleyip kargoya verin.',
          '4. Ürün depomuza ulaştıktan ve kontrol edildikten sonra ücret iadesi, ödeme yönteminize uygun şekilde yapılır.',
        ],
      },
      {
        heading: 'Ücret iadesi süresi',
        paragraphs: [
          'Onaylanan iadelerde bedel, bankanızın veya ödeme kuruluşunun işlem süresine bağlı olarak genellikle 3–14 iş günü içinde kartınıza iade edilir.',
        ],
      },
      {
        heading: 'İade edilemeyecek ürünler',
        paragraphs: [
          'Mevzuat ve hijyen kuralları gereği aşağıdaki ürün grupları cayma hakkı kapsamı dışında kalabilir:',
        ],
        bullets: [
          'Ambalajı açılmış hijyen ve kişisel bakım ürünleri',
          'Kişiye özel üretilen veya özelleştirilen ürünler',
          'Tüketicinin isteğiyle ambalajı açılan dijital içerik ve yazılımlar',
          'Tek kullanımlık veya hızlı bozulabilir ürünler',
        ],
      },
      {
        heading: 'Sipariş iptali',
        paragraphs: [
          'Siparişiniz henüz kargoya verilmediyse iptal talebinizi müşteri hizmetlerine iletebilirsiniz. Hazırlığa alınmış siparişlerde iptal mümkün olmayabilir; bu durumda iade prosedürü uygulanır.',
          'Kart ile ödenmiş ancak ürün gönderilmemiş siparişlerde iptal sonrası tam iade yapılır.',
        ],
      },
      {
        heading: 'Ayıplı veya yanlış ürün',
        paragraphs: [
          'Hasarlı, eksik veya yanlış gönderilen ürünlerde fotoğraf ile birlikte en kısa sürede bize ulaşın. Bu durumlarda iade kargo ücreti Nasyonel Toys tarafından karşılanır; değişim veya tam iade seçenekleri sunulur.',
        ],
      },
    ],
  },
  gizlilik: {
    title: 'Gizlilik Politikası',
    intro:
      'Kişisel verilerinizin güvenliği bizim için önceliklidir. Bu politika, sitede toplanan bilgilerin hangi amaçlarla işlendiğini ve nasıl korunduğunu açıklar.',
    highlights: [
      'Verileriniz üçüncü taraflara satılmaz',
      'Yalnızca sipariş ve yasal yükümlülükler için kullanılır',
      'SSL ile şifrelenmiş güvenli bağlantı',
    ],
    sections: [
      {
        heading: 'Toplanan veriler',
        paragraphs: [
          'Sipariş ve iletişim süreçlerinde aşağıdaki veriler toplanabilir:',
        ],
        bullets: [
          'Kimlik ve iletişim: ad soyad, telefon, e-posta',
          'Teslimat: açık adres, il/ilçe, posta kodu',
          'Sipariş: ürün bilgisi, tutar, ödeme yöntemi, sipariş numarası',
          'Teknik: IP adresi, tarayıcı türü, çerez verileri (Çerez Politikası)',
        ],
      },
      {
        heading: 'Verilerin kullanım amacı',
        paragraphs: [
          'Toplanan veriler yalnızca aşağıdaki amaçlarla işlenir:',
        ],
        bullets: [
          'Siparişin alınması, hazırlanması ve teslimatı',
          'Ödeme doğrulama ve müşteri destek hizmetleri',
          'Yasal saklama ve vergi yükümlülükleri',
          'Site güvenliği, dolandırıcılık önleme ve performans iyileştirme',
        ],
      },
      {
        heading: 'Veri paylaşımı',
        paragraphs: [
          'Kişisel verileriniz; kargo firması (teslimat için), ödeme/aracı kurumlar (ödeme işlemi için) ve kanunen yetkili kamu kurumları dışında paylaşılmaz.',
          'Pazarlama amaçlı liste satışı veya izinsiz profil oluşturma yapılmaz.',
        ],
      },
      {
        heading: 'Saklama süresi',
        paragraphs: [
          'Sipariş ve fatura verileri ticari ve vergi mevzuatı gereği yasal süreler boyunca saklanır. Pazarlama izni vermediyseniz bülten kayıtları talep üzerine silinir.',
        ],
      },
      {
        heading: 'Güvenlik',
        paragraphs: [
          'Sitemiz güvenli HTTPS bağlantısı kullanır. Erişim yetkileri sınırlandırılmıştır; düzenli olarak güncellenen teknik ve idari önlemler uygulanır.',
        ],
      },
      {
        heading: 'İletişim',
        paragraphs: [
          `Gizlilik ile ilgili sorularınız için ${EMAIL} adresine yazabilirsiniz.`,
        ],
      },
    ],
  },
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    intro:
      '6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan çerçevede işlemekteyiz.',
    highlights: [
      'Açık ve anlaşılır bilgilendirme',
      'KVKK md. 11 kapsamındaki haklarınız',
      'Talep ve başvuru kanalları',
    ],
    sections: [
      {
        heading: 'Veri sorumlusu',
        paragraphs: [
          `${COMPANY} — ${EMAIL} — ${PHONE}`,
          'Veri sorumlusu olarak kişisel verilerinizin işlenmesinden ve korunmasından sorumluyuz.',
        ],
      },
      {
        heading: 'İşlenen veri kategorileri',
        bullets: [
          'Kimlik (ad, soyad)',
          'İletişim (telefon, e-posta, adres)',
          'Müşteri işlem (sipariş, ödeme, iade kayıtları)',
          'İşlem güvenliği (log, IP, oturum)',
        ],
      },
      {
        heading: 'İşleme amaçları ve hukuki sebepler',
        paragraphs: [
          'Verileriniz; sözleşmenin kurulması ve ifası, hukuki yükümlülüklerin yerine getirilmesi, meşru menfaat ve açık rızanızın bulunduğu hallerde KVKK md. 5 ve 6 kapsamında işlenir.',
        ],
      },
      {
        heading: 'Aktarım',
        paragraphs: [
          'Tedarikçi, kargo ve bilişim altyapı hizmet sağlayıcılarına, yalnızca hizmetin gerektirdiği ölçüde ve gerekli güvenlik sözleşmeleriyle aktarım yapılabilir.',
        ],
      },
      {
        heading: 'Haklarınız (KVKK md. 11)',
        bullets: [
          'Kişisel verilerinizin işlenip işlenmediğini öğrenme',
          'İşlenmişse buna ilişkin bilgi talep etme',
          'Amacına uygun kullanılıp kullanılmadığını öğrenme',
          'Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme',
          'Eksik veya yanlış işlenmişse düzeltilmesini isteme',
          'Silinmesini veya yok edilmesini isteme',
          'Otomatik sistemlerle analiz sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme',
          'Kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme',
        ],
      },
      {
        heading: 'Başvuru',
        paragraphs: [
          `Haklarınızı kullanmak için ${EMAIL} üzerinden kimliğinizi tevsik edici bilgilerle başvurabilirsiniz. Talepler yasal süre içinde yanıtlanır.`,
        ],
      },
    ],
  },
  cerez: {
    title: 'Çerez Politikası',
    intro:
      'Web sitemizde deneyiminizi iyileştirmek ve site trafiğini analiz etmek için çerezler kullanılmaktadır. Bu sayfa hangi çerez türlerinin ne amaçla kullanıldığını açıklar.',
    highlights: [
      'Zorunlu çerezler site işlevi için gereklidir',
      'Analitik çerezler isteğe bağlıdır',
      'Tarayıcı ayarlarından yönetebilirsiniz',
    ],
    sections: [
      {
        heading: 'Çerez nedir?',
        paragraphs: [
          'Çerezler, ziyaret ettiğiniz internet sitesi tarafından cihazınıza kaydedilen küçük metin dosyalarıdır. Oturumun sürdürülmesi, sepet hatırlama ve istatistik üretimi gibi işlevler için kullanılır.',
        ],
      },
      {
        heading: 'Kullandığımız çerez türleri',
        bullets: [
          'Zorunlu çerezler: Güvenlik, oturum ve temel site işlevleri için gereklidir; kapatılamaz.',
          'Performans/analitik çerezler: Ziyaret sayısı ve sayfa kullanımı hakkında anonim istatistik sağlar.',
          'İşlevsel çerezler: Dil veya tercih hatırlama gibi kolaylık sağlar.',
        ],
      },
      {
        heading: 'Çerezleri yönetme',
        paragraphs: [
          'Tarayıcınızın ayarlar menüsünden çerezleri silebilir veya engelleyebilirsiniz. Zorunlu çerezlerin kapatılması sepet ve sipariş işlemlerini etkileyebilir.',
        ],
      },
      {
        heading: 'Güncellemeler',
        paragraphs: [
          'Bu politika gerektiğinde güncellenir. Güncel metin her zaman bu sayfada yayımlanır.',
        ],
      },
    ],
  },
  'on-bilgilendirme': {
    title: 'Ön Bilgilendirme Formu',
    intro:
      'Mesafeli sözleşme kurulmadan önce tüketicinin bilgilendirilmesi zorunludur. Sipariş öncesi aşağıdaki bilgileri okumanızı öneririz.',
    highlights: [
      `${FREE_SHIPPING_MIN} TL üzeri ücretsiz kargo`,
      'Şeffaf fiyat ve sipariş özeti',
      `${RETURN_DAYS} iş günü iade hakkı`,
    ],
    sections: [
      {
        heading: 'Satıcı bilgileri',
        paragraphs: [
          `${COMPANY} (${BRAND})`,
          `E-posta: ${EMAIL}`,
          `Telefon: ${PHONE}`,
          'Web: www.nasyoneltoys.com',
        ],
      },
      {
        heading: 'Ürün ve bedel',
        paragraphs: [
          'Sipariş özetinde her ürün için ad, adet, birim fiyat ve ara toplam gösterilir. Varsa indirim, kupon ve kargo bedeli ayrı satırlarda belirtilir.',
          'Ödeme yöntemine göre nihai ödenecek tutar onay ekranında yer alır; ödeme PayTR güvenli altyapısı ile alınır.',
        ],
      },
      {
        heading: 'Teslimat',
        paragraphs: [
          `Standart teslimat süresi stok ve bölgeye göre değişir; tahmini süre sipariş onayı sonrası bildirilir.`,
          `${FREE_SHIPPING_MIN} TL ve üzeri siparişlerde kargo ücreti alıcıya yansıtılmaz. Altındaki siparişlerde kargo bedeli sepet ve ödeme adımında gösterilir.`,
        ],
      },
      {
        heading: 'Cayma hakkı',
        paragraphs: [
          `Teslimattan itibaren ${RETURN_DAYS} gün içinde cayma hakkınız bulunmaktadır. Detaylar İptal & İade Politikası sayfasındadır.`,
        ],
      },
      {
        heading: 'Şikâyet ve uyuşmazlık',
        paragraphs: [
          `Öncelikle ${EMAIL} üzerinden bizimle iletişime geçebilirsiniz. Çözülemeyen uyuşmazlıklarda Tüketici Hakem Heyetleri ve Mahkemeleri yetkilidir.`,
        ],
      },
    ],
  },
  'teslimat-kargo': {
    title: 'Teslimat ve Kargo Koşulları',
    seoTitle: 'Teslimat ve Kargo Koşulları | Nasyonel Toys',
    seoDescription:
      'Sipariş hazırlık süresi, kargo teslim süresi, hafta sonu gönderim, hasarlı ürün ve teslim alınmayan kargo prosedürleri. Türkiye geneli hızlı teslimat.',
    intro:
      'Nasyonel Toys olarak siparişlerinizi özenle hazırlayıp güvenilir kargo firmalarıyla adresinize ulaştırıyoruz. Aşağıda teslimat süreçleri, kargo koşulları ve özel durumlar detaylı şekilde açıklanmıştır.',
    highlights: [
      `${FREE_SHIPPING_MIN} TL ve üzeri siparişlerde ücretsiz kargo`,
      'Ödeme onayı sonrası hızlı hazırlık',
      'Kargo takip numarası ile anlık takip',
      'Türkiye geneli teslimat',
    ],
    sections: [
      {
        heading: 'Teslimat bölgeleri',
        paragraphs: [
          'Türkiye Cumhuriyeti sınırları içindeki tüm illere anlaşmalı kargo firmaları aracılığıyla teslimat yapılmaktadır.',
          'Adres bilgilerinizin (il, ilçe, mahalle, cadde/sokak, bina ve daire no, telefon) eksiksiz ve doğru girilmesi teslimat süresini kısaltır. Hatalı adres nedeniyle oluşan gecikmelerden satıcı sorumlu tutulamaz.',
        ],
      },
      {
        heading: 'Sipariş hazırlık süresi',
        paragraphs: [
          'PayTR üzerinden ödemeniz onaylandıktan sonra siparişiniz depo ekibimize iletilir ve hazırlık süreci başlar.',
          'Stokta bulunan ürünler için standart hazırlık süresi 1–2 iş günüdür. Yoğun kampanya dönemlerinde (bayram, yılbaşı, okul dönemi vb.) bu süre 3 iş gününe kadar uzayabilir.',
          'Siparişinizde birden fazla ürün varsa tüm kalemler hazır olduğunda tek paket halinde kargoya verilir; kısmi gönderim yapılmaz.',
          'Hazırlık tamamlandığında kargo bilgisi e-posta ile paylaşılır; ayrıca sipariş takip sayfasından durumu kontrol edebilirsiniz.',
        ],
      },
      {
        heading: 'Kargo teslim süresi',
        paragraphs: [
          'Sipariş kargoya verildikten sonra teslimat süresi bulunduğunuz ile ve kargo firmasının dağıtım yoğunluğuna göre değişir.',
          'Büyükşehir ve merkez ilçelerde genellikle 1–3 iş günü; diğer il ve ilçelerde 2–5 iş günü içinde teslimat hedeflenir.',
          'Uzak bölge, adalar ve köy servisi gerektiren adreslerde süre 7 iş gününe kadar uzayabilir.',
          'Kargo takip numaranızı kullanarak paketinizin güzergâhını anlık olarak izleyebilirsiniz.',
        ],
      },
      {
        heading: 'Hafta sonu gönderim bilgisi',
        paragraphs: [
          'Kargo firmalarının operasyon takvimine bağlı olarak cumartesi günleri birçok bölgede teslimat yapılabilir; pazar günleri genellikle dağıtım yapılmaz.',
          'Cuma günü öğleden sonra veya hafta sonu verilen siparişler, stok ve hazırlık durumuna göre en erken pazartesi iş günü kargoya verilir.',
          'Hafta sonu kargoya verilen paketlerin teslimatı, kargo firmasının bölgesel çalışma saatlerine tabidir.',
        ],
      },
      {
        heading: 'Kargo firması bilgisi',
        paragraphs: [
          'Gönderilerimiz; Yurtiçi Kargo, Aras Kargo, MNG Kargo veya Sürat Kargo gibi anlaşmalı taşıyıcı firmalardan biriyle yapılır. Bölge, hacim ve operasyonel uygunluğa göre firma seçimi Nasyonel Toys tarafından belirlenir.',
          'Kargo firması ve takip numarası, siparişiniz kargoya verildiğinde kayıtlı e-posta adresinize iletilir.',
          'Teslimat sırasında kargo görevlisinden kimlik veya imza talep edilebilir; bu, güvenli teslimat prosedürünün parçasıdır.',
        ],
      },
      {
        heading: 'Kargo ücreti',
        paragraphs: [
          `${FREE_SHIPPING_MIN} TL ve üzeri siparişlerde kargo bedeli alıcıya yansıtılmaz.`,
          'Bu tutarın altındaki siparişlerde kargo ücreti sepet ve ödeme adımında açıkça gösterilir; onay vermeden önce toplam tutarı görebilirsiniz.',
        ],
      },
      {
        heading: 'Hasarlı ürün prosedürü',
        paragraphs: [
          'Kargo tesliminde paket dışında ezilme, yırtılma veya ıslanma gibi belirgin hasar varsa ürünü teslim almadan önce kargo görevlisiyle birlikte tutanak tutturmanızı öneririz.',
          'Hasarlı veya eksik ürün teslim alındıysa, teslimattan itibaren en geç 48 saat içinde paket ve ürün fotoğraflarıyla birlikte bize ulaşın.',
          'Doğrulanan hasarlı gönderilerde yeniden gönderim veya tam iade seçenekleri sunulur; bu durumlarda iade kargo masrafı Nasyonel Toys tarafından karşılanır.',
        ],
        bullets: [
          'Fotoğrafta kargo etiketi, paket dışı ve ürün hasarı net görünmelidir.',
          'Sipariş numaranızı iletişimde mutlaka belirtin.',
        ],
      },
      {
        heading: 'Teslim alınmayan kargo süreci',
        paragraphs: [
          'Adreste bulunulmaması, yanlış adres veya teslimat reddi nedeniyle kargo firmasına iade dönen paketler depomuza geri alınır.',
          'İade kargosu tarafımıza ulaştıktan sonra müşteri hizmetleri sizinle iletişime geçer; adres doğrulaması yapılarak yeniden gönderim planlanır.',
          'Yeniden gönderimde ek kargo ücreti talep edilebilir; ücretsiz yeniden gönderim yalnızca satıcı kaynaklı hatalarda uygulanır.',
          'Teslim alınmayan siparişlerde 15 gün içinde işlem yapılmazsa sipariş iptal edilerek ücret iadesi değerlendirilebilir.',
        ],
      },
      {
        heading: 'Resmi tatil bilgilendirmesi',
        paragraphs: [
          'Resmi tatil günlerinde (bayramlar, 1 Ocak, 23 Nisan, 1 Mayıs, 19 Mayıs, 15 Temmuz, 30 Ağustos, 29 Ekim vb.) kargo firmaları dağıtım yapmaz; bu günlerde verilen siparişler tatil sonrası ilk iş gününde işleme alınır.',
          'Bayram öncesi ve sonrası yoğunluk nedeniyle hazırlık ve teslimat süreleri uzayabilir; bu dönemlerde sipariş onay e-postasında güncel tahmini süre paylaşılır.',
          'Tatil dönemlerinde müşteri hizmetleri e-posta yanıt süreleri uzayabilir; acil durumlarda WhatsApp hattımızı kullanabilirsiniz.',
        ],
      },
      {
        heading: 'Teslimat sırasında dikkat edilecekler',
        bullets: [
          'Teslimat adresi değişikliği yalnızca sipariş kargoya verilmeden önce mümkün olabilir.',
          'Kapıda ödeme seçeneği bulunmamaktadır; tüm ödemeler PayTR güvenli kart altyapısı ile alınır.',
          'Teslimat sorunlarında öncelikle sipariş takip sayfasını ve kargo firmasının çağrı merkezini kontrol edin; çözülmezse bize yazın.',
        ],
      },
      {
        heading: 'İletişim',
        paragraphs: [
          `Teslimat ve kargo ile ilgili tüm sorularınız için ${EMAIL} e-posta adresine yazabilir veya ${PHONE} numarasından bize ulaşabilirsiniz.`,
          'Sipariş numaranızı ve kargo takip kodunuzu iletişimde belirtmeniz süreci hızlandırır.',
        ],
      },
    ],
  },
};

export { COMPANY, EMAIL, PHONE, FREE_SHIPPING_MIN, RETURN_DAYS };
