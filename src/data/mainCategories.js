/** Ana kategori ağacı — mobil menü, SEO landing ve breadcrumb */

export const MAIN_CATEGORIES = [
  {
    id: 'pelus',
    name: 'Peluş Oyuncaklar',
    slug: 'pelus-oyuncaklar',
    icon: '🧸',
    seoTitle: 'Peluş Oyuncaklar | Nasyonel Toys',
    seoDescription:
      'Yumuşak peluş oyuncaklar, sevimli karakterler ve bebek peluşları. Güvenli alışveriş, hızlı kargo.',
    intro:
      'Çocukların en sevdiği yumuşak peluş oyuncaklar; güvenli malzemeler ve geniş model seçeneği.',
    seoFooter:
      'Peluş oyuncak kategorisinde Nasyonel Toys güvenilir alışveriş ve uygun fiyat sunar. Türkiye geneli hızlı kargo.',
    keywords: ['peluş', 'pelus', 'yumuşak', 'bebek figür', 'bebek & figür', 'oyuncak bebek'],
  },
  {
    id: 'egitici',
    name: 'Eğitici Oyuncaklar',
    slug: 'egitici-oyuncaklar',
    icon: '🎓',
    seoTitle: 'Eğitici Oyuncaklar | Nasyonel Toys',
    seoDescription:
      'Montessori, STEM ve öğrenme oyuncakları. Çocuğun gelişimine katkı sağlayan eğitici ürünler.',
    intro:
      'Motor beceri, yaratıcılık ve öğrenmeyi destekleyen eğitici oyuncak koleksiyonu.',
    seoFooter:
      'Eğitici oyuncaklar ile çocukların öğrenme yolculuğuna Nasyonel Toys ile güvenle eşlik edin.',
    keywords: ['eğitici', 'egitici', 'montessori', 'öğrenme', 'stem', 'ahşap', 'bulmaca'],
  },
  {
    id: 'kutu',
    name: 'Kutu Oyunları',
    slug: 'kutu-oyunlari',
    icon: '🎲',
    seoTitle: 'Kutu Oyunları | Nasyonel Toys',
    seoDescription:
      'Aile ve arkadaş grupları için kutu oyunları. Strateji, eğlence ve sosyal beceri geliştiren oyunlar.',
    intro: 'Her yaş için eğlenceli kutu oyunları ve masa oyunları.',
    seoFooter: 'Kutu oyunları kategorisinde en popüler seçenekler Nasyonel Toys’ta.',
    keywords: ['kutu oyun', 'masa oyun', 'board', 'strateji oyun'],
  },
  {
    id: 'zeka',
    name: 'Zeka Oyuncakları',
    slug: 'zeka-oyuncaklari',
    icon: '🧩',
    seoTitle: 'Zeka Oyuncakları | Nasyonel Toys',
    seoDescription:
      'Puzzle, yapboz ve zeka geliştiren oyuncaklar. Dikkat ve problem çözme becerilerini destekler.',
    intro: 'Zeka ve dikkat geliştiren puzzle, yapboz ve mantık oyunları.',
    seoFooter: 'Zeka oyuncakları ile eğlenceli öğrenme deneyimi sunuyoruz.',
    keywords: ['zeka', 'puzzle', 'yapboz', 'bulmaca', 'mantık'],
  },
  {
    id: 'bebek',
    name: 'Bebek Oyuncakları',
    slug: 'bebek-oyuncaklari',
    icon: '👶',
    seoTitle: 'Bebek Oyuncakları | Nasyonel Toys',
    seoDescription:
      'Bebekler için güvenli, yumuşak ve gelişim odaklı oyuncaklar. 0–3 yaş uygun ürünler.',
    intro: 'Bebeklerin güvenle oynayabileceği, yaşa uygun oyuncak seçenekleri.',
    seoFooter: 'Bebek oyuncaklarında güvenlik ve kalite önceliğimizdir.',
    keywords: ['bebek', '0-3', 'emzik', 'cıngırak', 'aktivite', 'bebek oyuncak'],
  },
  {
    id: 'yazlik',
    name: 'Yazlık Oyuncaklar',
    slug: 'yazlik-oyuncaklar',
    icon: '☀️',
    seoTitle: 'Yazlık Oyuncaklar | Nasyonel Toys',
    seoDescription:
      'Deniz, havuz ve açık hava oyuncakları. Yaz tatili için eğlenceli outdoor ürünler.',
    intro: 'Yaz ayları için deniz, kum ve açık hava oyuncakları.',
    seoFooter: 'Yazlık oyuncaklar ile outdoor eğlence Nasyonel Toys’ta.',
    keywords: ['yaz', 'deniz', 'havuz', 'kum', 'outdoor', 'açık hava', 'su tabancası'],
  },
];

export function getMainCategoryBySlug(slug) {
  const s = String(slug || '').toLowerCase();
  return MAIN_CATEGORIES.find((c) => c.slug === s) || null;
}

export function normalizeCategoryText(text) {
  return String(text || '')
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

export function productMatchesMainCategory(product, mainCategory) {
  const cat = normalizeCategoryText(product?.category || '');
  const name = normalizeCategoryText(product?.name || '');
  const haystack = `${cat} ${name}`;
  return (mainCategory.keywords || []).some((kw) => {
    const k = normalizeCategoryText(kw);
    return k && haystack.includes(k);
  });
}

export function groupProductsByMainCategory(products) {
  const list = Array.isArray(products) ? products : [];
  const grouped = {};
  MAIN_CATEGORIES.forEach((mc) => {
    grouped[mc.slug] = [];
  });
  const other = [];

  list.forEach((p) => {
    const match = MAIN_CATEGORIES.find((mc) => productMatchesMainCategory(p, mc));
    if (match) grouped[match.slug].push(p);
    else other.push(p);
  });

  return { grouped, other };
}

export function getSubcategoriesForMain(products, mainCategory) {
  const matched = (Array.isArray(products) ? products : []).filter((p) =>
    productMatchesMainCategory(p, mainCategory),
  );
  const subs = new Map();
  matched.forEach((p) => {
    const name = String(p.category || 'Diğer').trim() || 'Diğer';
    subs.set(name, (subs.get(name) || 0) + 1);
  });
  return [...subs.entries()]
    .map(([name, count]) => ({ name, count, slug: name }))
    .sort((a, b) => b.count - a.count);
}

export function filterProductsBySubcategory(products, mainCategory, subcategoryName) {
  return (Array.isArray(products) ? products : []).filter(
    (p) =>
      productMatchesMainCategory(p, mainCategory) &&
      String(p.category || '').trim() === String(subcategoryName || '').trim(),
  );
}

/** Ana kategorideki ürün sayısı */
export function countProductsInMainCategory(products, mainCategory) {
  return (Array.isArray(products) ? products : []).filter((p) =>
    productMatchesMainCategory(p, mainCategory),
  ).length;
}

/** En az bir ürünü olan ana kategoriler */
export function getActiveMainCategories(products) {
  const list = Array.isArray(products) ? products : [];
  return MAIN_CATEGORIES.filter((mc) => countProductsInMainCategory(list, mc) > 0);
}

/** Alt kategoride ürün var mı */
export function hasProductsInSubcategory(products, mainCategory, subcategoryName) {
  return filterProductsBySubcategory(products, mainCategory, subcategoryName).length > 0;
}
