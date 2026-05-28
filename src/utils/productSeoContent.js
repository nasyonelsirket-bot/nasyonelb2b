/**
 * Ürün sayfası SEO içerik üretimi — açıklama, özellikler, SSS (katalog alanı yoksa şablon)
 */

const CATEGORY_SEO_BLOCKS = {
  egitici: {
    keywords: 'eğitici oyuncak, montessori oyuncak, çocuk gelişim oyuncağı, eğitici oyun seti',
    paragraph:
      '{name}, çocukların motor becerilerini, yaratıcılığını ve problem çözme yeteneğini destekleyen eğitici oyuncak kategorisinde yer alır. Montessori ve STEM yaklaşımına uygun materyallerle hazırlanan bu ürün, evde ve anaokulunda güvenle kullanılabilir. Eğitici oyuncaklar, çocuğun yaşına uygun zorluk seviyesi sunarak öğrenmeyi oyunla birleştirir.',
  },
  zeka: {
    keywords: 'zeka geliştirici oyuncak, puzzle, yapboz, mantık oyunu',
    paragraph:
      '{name}, dikkat, konsantrasyon ve mantıksal düşünmeyi güçlendiren zeka oyuncakları arasında öne çıkar. Yapboz ve bulmaca tarzı aktiviteler çocukların sabırla çözüm üretmesine yardımcı olur. Zeka geliştirici oyuncaklar, okul öncesi ve ilkokul döneminde bilişsel gelişimi destekler.',
  },
  pelus: {
    keywords: 'peluş oyuncak, yumuşak oyuncak, çocuk oyuncakları',
    paragraph:
      '{name}, yumuşak dokusu ve sevimli tasarımıyla peluş oyuncak seven çocuklar için ideal bir seçenektir. CE uyumlu malzemeler ve güvenli dikiş detaylarıyla üretilmiştir. Peluş oyuncaklar, duygusal gelişim ve hayal gücü oyunlarını destekler.',
  },
  bebek: {
    keywords: 'bebek oyuncakları, 0-3 yaş oyuncak, çocuk gelişim oyuncağı',
    paragraph:
      '{name}, bebeklerin güvenli keşif dönemine uygun olarak tasarlanmıştır. Yumuşak formlar, canlı renkler ve duyusal uyaranlar bebeklerin görme-işitme gelişimine katkı sağlar. Bebek oyuncaklarında hijyen ve dayanıklılık ön plandadır.',
  },
  kutu: {
    keywords: 'kutu oyunu, aile oyunu, masa oyunu',
    paragraph:
      '{name}, aile ve arkadaş gruplarıyla keyifli vakit geçirmek için tasarlanmış kutu oyunu kategorisindedir. Sosyal beceri, strateji ve eğlenceyi bir araya getirir. Kutu oyunları, yaşa uygun kurallarla çocukların grup oyununa katılmasını kolaylaştırır.',
  },
  yazlik: {
    keywords: 'yazlık oyuncak, açık hava oyuncağı, outdoor oyuncak',
    paragraph:
      '{name}, yaz aylarında bahçe, park ve plajda kullanılmak üzere tasarlanmış outdoor oyuncaktır. Fiziksel aktiviteyi teşvik eder ve çocukların açık havada aktif kalmasına yardımcı olur.',
  },
  default: {
    keywords: 'çocuk oyuncakları, oyuncak seti, eğitici oyuncak',
    paragraph:
      '{name}, Nasyonel Toys güvencesiyle sunulan kaliteli çocuk oyuncakları arasındadır. Güvenli malzeme, şeffaf fiyat ve hızlı kargo ile ailelerin tercih ettiği ürünlerden biridir. Çocuğunuzun yaşına ve ilgi alanına uygun olarak seçilmiştir.',
  },
};

function detectCategoryKey(product) {
  const hay = `${product?.category || ''} ${product?.name || ''}`.toLocaleLowerCase('tr');
  if (/eğitici|egitici|montessori|stem|ahşap|ahsap/.test(hay)) return 'egitici';
  if (/zeka|puzzle|yapboz|bulmaca|mantık/.test(hay)) return 'zeka';
  if (/peluş|pelus|yumuşak/.test(hay)) return 'pelus';
  if (/bebek|0-3|emzik|cıngırak/.test(hay)) return 'bebek';
  if (/kutu|masa oyun|board/.test(hay)) return 'kutu';
  if (/yaz|deniz|havuz|outdoor|açık hava/.test(hay)) return 'yazlik';
  return 'default';
}

function interpolate(template, product) {
  return String(template || '').replace(/\{name\}/g, product?.name || 'Bu ürün');
}

export function getProductImageAlt(product, index = 0) {
  const name = String(product?.name || 'Ürün').trim();
  const cat = String(product?.category || 'oyuncak').trim();
  if (index > 0) return `${name} — görsel ${index + 1} (${cat})`;
  return `${name} — ${cat} | Nasyonel Toys`;
}

export function getProductFeatures(product) {
  if (Array.isArray(product?.features) && product.features.length) {
    return product.features.map((f) => String(f).trim()).filter(Boolean);
  }

  const features = [];
  const cat = product?.category;
  if (cat) features.push(`Kategori: ${cat}`);
  if (product?.sku) features.push(`Stok kodu: ${product.sku}`);
  features.push('Güvenli ödeme (PayTR 3D Secure)');
  features.push('Türkiye geneli hızlı kargo');
  features.push('14 iş günü içinde iade hakkı');
  features.push('Orijinal ve kalite kontrollü ürün');

  const key = detectCategoryKey(product);
  if (key === 'egitici') {
    features.push('Eğitici ve gelişim odaklı tasarım');
    features.push('Montessori / öğrenme oyuncağı uyumlu kullanım');
  }
  if (key === 'zeka') features.push('Zeka ve dikkat gelişimini destekler');
  if (key === 'pelus') features.push('Yumuşak ve çocuk dostu malzeme');
  if (product?.isNew) features.push('Yeni ürün');
  if (product?.isCampaign) features.push('Kampanyalı fiyat avantajı');

  return features;
}

export function getProductFaqs(product) {
  if (Array.isArray(product?.seo_faq) && product.seo_faq.length) {
    return product.seo_faq.map((item) => ({
      q: String(item.q || item.question || '').trim(),
      a: String(item.a || item.answer || '').trim(),
    })).filter((i) => i.q && i.a);
  }

  const name = product?.name || 'Bu ürün';
  return [
    {
      q: `${name} kaç yaş için uygundur?`,
      a: 'Ürün açıklamasındaki yaş bilgisini kontrol edin. Uygun değilse müşteri hizmetlerimizden yaş önerisi alabilirsiniz.',
    },
    {
      q: 'Kargo ne kadar sürede gelir?',
      a: 'Stoktaki siparişler genellikle 1–2 iş günü içinde kargoya verilir. Teslimat bölgeye göre 1–5 iş günü sürer.',
    },
    {
      q: 'İade yapabilir miyim?',
      a: 'Teslimattan itibaren 14 iş günü içinde, kullanılmamış ürünlerde iade veya değişim talep edebilirsiniz.',
    },
    {
      q: 'Ödeme güvenli mi?',
      a: 'Evet. PayTR altyapısı ile 3D Secure destekli güvenli kart ödemesi yapılır.',
    },
  ];
}

/** SEO için zenginleştirilmiş metin paragrafları (300+ kelime hedefi) */
export function getProductSeoParagraphs(product) {
  const key = detectCategoryKey(product);
  const block = CATEGORY_SEO_BLOCKS[key] || CATEGORY_SEO_BLOCKS.default;
  const baseDesc = String(product?.description || '').trim();
  const paragraphs = [];

  if (baseDesc) paragraphs.push(baseDesc);

  paragraphs.push(interpolate(block.paragraph, product));

  paragraphs.push(
    `Nasyonel Toys olarak ${block.keywords} arayan ailelere geniş ürün yelpazesi sunuyoruz. ${product?.name || 'Ürün'}, online mağazamızdan güvenle sipariş edilebilir; stok durumu ürün sayfasında anlık olarak gösterilir.`,
  );

  paragraphs.push(
    'Siparişinizi tamamladıktan sonra onay e-postası alırsınız. Kargo takip bilgisi gönderim sonrası paylaşılır. 500 TL ve üzeri alışverişlerde kargo bedeli alıcıya yansıtılmaz. Müşteri memnuniyeti odaklı destek ekibimiz sorularınız için hafta içi yanınızdadır.',
  );

  paragraphs.push(
    'Çocuk oyuncakları seçerken yaşa uygunluk, malzeme güvenliği ve eğitsel değer önemlidir. Ürün görselleri ve açıklamaları detaylı incelemenizi öneririz. Benzer kategorideki diğer ürünleri de sayfanın altındaki önerilerden keşfedebilirsiniz.',
  );

  return paragraphs;
}

export function countWords(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function getProductSeoWordCount(product) {
  const all = getProductSeoParagraphs(product).join(' ');
  return countWords(all);
}
