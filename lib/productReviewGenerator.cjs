/**
 * Ürüne özel, çeşitli değerlendirme metinleri (deterministik)
 */

const REVIEWS_VERSION = 3;

const FIRST = ['Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Merve', 'Selin', 'Deniz', 'Can', 'Emre', 'Burak', 'Gamze', 'Ece', 'Hakan', 'Özge'];
const LAST = ['K.', 'Y.', 'A.', 'T.', 'D.', 'S.', 'M.', 'B.', 'Ç.', 'Ö.'];

const UNIVERSAL = [
  (sn) => `${sn} için sipariş verdik, paket hasarsız geldi.`,
  (sn) => `${sn} beklentimizi karşıladı, tekrar alırız.`,
  (sn) => `Fiyatına göre ${sn} gayet iyi, memnun kaldık.`,
  (sn) => `${sn} hediye ettim, çocuk hemen oynamaya başladı.`,
  (sn) => `Kargo süresi makul, ${sn} açıklamadaki gibi çıktı.`,
];

const BY_KIND = {
  race: [
    (sn) => `${sn} pisti kurmak 10 dakika sürdü, arabalar raydan çıkmıyor.`,
    (sn) => `Oğlum ${sn} ile saatlerce oynuyor, ekleme parçaları uyumlu.`,
    (sn) => `${sn} esnek yapısı sayesinde köşeleri rahat dönüyor.`,
    (sn) => `İki çocuk aynı anda ${sn} üzerinde yarışıyor, eğlenceli.`,
    (sn) => `${sn} için yedek araba da aldık, set tam oldu.`,
    (sn) => `Salonda ${sn} kurduk, ses çok rahatsız etmiyor.`,
    (sn) => `${sn} parçaları birbirine iyi oturuyor, sök-tak kolay.`,
    (sn) => `4 yaş için ${sn} ideal, küçük parçalara dikkat ettik.`,
  ],
  car: [
    (sn) => `${sn} arabaları sağlam, tekerlekleri akıcı dönüyor.`,
    (sn) => `Çocuk ${sn} setini arabalarla birlikte çok sevdi.`,
    (sn) => `${sn} metal/plastik karışımı kaliteli duruyor.`,
    (sn) => `Garaj seti ${sn} ile oyun kurmak kolay, parçalar eksiksiz.`,
    (sn) => `${sn} fiyatına göre iyi, koleksiyona uygun.`,
  ],
  puzzle: [
    (sn) => `${sn} parçaları net baskılı, kenarlar düzgün kesilmiş.`,
    (sn) => `Ailece ${sn} yaptık, 500 parça ama keyifliydi.`,
    (sn) => `${sn} kutusunda referans resim var, karıştırmadık.`,
    (sn) => `6 yaşındaki kızım ${sn} ile sabırla uğraştı, eğitici.`,
    (sn) => `${sn} tamamlandığında görüntü çok güzel, çerçeveledik.`,
    (sn) => `Parçalar ${sn} için sert karton, bükülme yok.`,
  ],
  doll: [
    (sn) => `${sn} dikişleri düzgün, kumaşı yumuşak.`,
    (sn) => `Kızım ${sn} ile uyuyor, yıkamada renk atmıyor.`,
    (sn) => `${sn} boyutu fotoğraftaki gibi, sürpriz olmadı.`,
    (sn) => `Figür ${sn} detaylı, oyun hikayeleri kuruyorlar.`,
    (sn) => `${sn} hediye paketi için uygun, çok sevildi.`,
  ],
  educational: [
    (sn) => `${sn} Montessori tarzı, çocuk kendi kendine öğreniyor.`,
    (sn) => `Ahşap ${sn} köşeleri yuvarlatılmış, güvenli.`,
    (sn) => `${sn} renkleri canlı, kokusuz malzeme.`,
    (sn) => `Anaokulu öğretmeni ${sn} önerdi, memnunuz.`,
    (sn) => `${sn} ile ince motor becerisi gelişti.`,
    (sn) => `Bloklar ${sn} setinde dengeli, devrilme az.`,
  ],
  outdoor: [
    (sn) => `${sn} bahçede kullandık, güneşte renk solmadı.`,
    (sn) => `Parkta ${sn} ile oynadılar, dayanıklı görünüyor.`,
    (sn) => `${sn} katlanınca az yer kaplıyor, taşıması kolay.`,
    (sn) => `Yaz için ${sn} aldık, aktivite süresi uzadı.`,
    (sn) => `${sn} montajı basit, vidalar eksiksiz geldi.`,
  ],
  party: [
    (sn) => `${sn} doğum gününde kullandık, renkler canlı.`,
    (sn) => `Parti için ${sn} yetti, misafirler beğendi.`,
    (sn) => `${sn} kolay şişirildi, sönme olmadı.`,
    (sn) => `Kutlama seti ${sn} ile hazırlandı, pratik.`,
  ],
  building: [
    (sn) => `${sn} parçaları birbirine sıkı oturuyor.`,
    (sn) => `Yapı seti ${sn} ile kule kurduk, yıkılınca da eğlenceli.`,
    (sn) => `${sn} kutusunda parça listesi var, eksik yok.`,
    (sn) => `7 yaş ${sn} için uygun, talimat anlaşılır.`,
    (sn) => `Kreatif oyun için ${sn} süper, saatler geçiyor.`,
  ],
  plush: [
    (sn) => `${sn} peluşu yumuşak, dikişler sağlam.`,
    (sn) => `Bebek ${sn} ile uyuyor, alerji yapmadı.`,
    (sn) => `${sn} boyutu tam istediğimiz gibi.`,
    (sn) => `Yıkama sonrası ${sn} formunu korudu.`,
  ],
  general: [
    (sn) => `${sn} kalitesi fiyatına göre iyi.`,
    (sn) => `Çocuklar ${sn} ile uzun süre oynadı.`,
    (sn) => `${sn} kutusu özenli, içerik eksiksiz.`,
    (sn) => `İkinci kez ${sn} siparişi verdik.`,
    (sn) => `${sn} açıklamadaki özelliklerle uyumlu.`,
    (sn) => `Komşumuzun tavsiyesiyle ${sn} aldık, pişman değiliz.`,
  ],
};

function hash(s) {
  let h = 0;
  const str = String(s);
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function pick(arr, seed, i) {
  return arr[(seed + i * 17) % arr.length];
}

function norm(s) {
  return String(s || '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

function detectProductKind(product) {
  const text = norm(`${product.name} ${product.category} ${product.brand}`);
  if (/pist|yaris|flex track|hot wheels|slot|looping/.test(text)) return 'race';
  if (/araba|otomobil|garaj|arac|kamyon|tir|polis arac/.test(text)) return 'car';
  if (/puzzle|yapboz|zeka|bulmaca|parca birlestir/.test(text)) return 'puzzle';
  if (/pelus|peluş|oyuncak ayi|oyuncak ayı|yastik/.test(text)) return 'plush';
  if (/bebek|figur|figür|kukla|barbie|karakter/.test(text)) return 'doll';
  if (/montessori|egitici|eğitici|ahsap|ahşap|blok|zeka gelistir/.test(text)) return 'educational';
  if (/kamp|outdoor|spor|bisiklet|scooter|havuz|suluk|park/.test(text)) return 'outdoor';
  if (/parti|balon|konfeti|dogum gunu|doğum günü|susleme/.test(text)) return 'party';
  if (/lego|yapi|yapı|insaat|inşaat|yapi set|yapı set/.test(text)) return 'building';
  return 'general';
}

function shortName(name) {
  const n = String(name || 'Bu ürün').trim();
  if (n.length <= 48) return n;
  const cut = n.slice(0, 45);
  const sp = cut.lastIndexOf(' ');
  return (sp > 20 ? cut.slice(0, sp) : cut) + '…';
}

function buildCommentPool(kind) {
  const specific = BY_KIND[kind] || [];
  const general = BY_KIND.general;
  const merged = [...specific, ...UNIVERSAL, ...general];
  const seen = new Set();
  const unique = [];
  merged.forEach((fn) => {
    const key = String(fn);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(fn);
    }
  });
  return unique.length ? unique : BY_KIND.general;
}

/** Görünen yorum sayısı (10–15) ve vitrindeki toplam sayı (ürüne özel) */
function resolveReviewCounts(seed, ty, requestedCount) {
  const visible = Math.min(15, Math.max(10, requestedCount ?? 10 + (seed % 6)));
  const tyCount = Number(ty?.count) || 0;
  if (tyCount > visible) {
    return { visible, display: tyCount };
  }
  const spread = 22 + (seed % 89) + ((seed * 13) % 71) + ((seed * 31) % 53);
  const display = Math.max(visible + 4, spread);
  return { visible, display };
}

function generateProductReviews(product, count) {
  const seed = hash(`${product.id}|${product.sku}|${product.barcode}|${product.name}`);
  const ty = product.trendyolRating;
  const targetAvg = ty?.avg || 4.6;
  const { visible: n, display: reviewCount } = resolveReviewCounts(seed, ty, count);
  const now = Date.now();
  const kind = detectProductKind(product);
  const specific = BY_KIND[kind] || BY_KIND.general;
  const mixed = buildCommentPool(kind);
  const sn = shortName(product.name);
  const usedTexts = new Set();
  const reviews = [];

  for (let i = 0; i < n; i += 1) {
    const roll = (seed + i * 13) % 100;
    let stars = 5;
    if (roll > 90) stars = 4;
    else if (roll > 97) stars = 3;
    if (targetAvg >= 4.5 && roll > 6) stars = 5;

    const preferSpecific = i < Math.max(8, n - 3) && specific.length > 0;
    const pool = preferSpecific ? specific : mixed;

    let idx = (seed + i * 37) % pool.length;
    let comment = '';
    for (let attempt = 0; attempt < pool.length; attempt += 1) {
      comment = pool[idx](sn);
      if (!usedTexts.has(comment)) break;
      idx = (idx + 11) % pool.length;
    }
    usedTexts.add(comment);

    const daysAgo = 3 + ((seed + i * 7) % 180);
    reviews.push({
      id: `gen-${seed}-${i}`,
      author: `${pick(FIRST, seed, i)} ${pick(LAST, seed, i + 3)}`,
      rating: stars,
      comment,
      date: new Date(now - daysAgo * 86400000).toISOString(),
      source: ty ? 'trendyol-sync' : 'generated',
      verified: true,
    });
  }

  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  const avg = Math.round((sum / reviews.length) * 10) / 10;

  return {
    reviews,
    ratingAvg: ty?.avg || avg,
    reviewCount,
    ratingSource: ty ? 'trendyol' : 'generated',
    reviewsVersion: REVIEWS_VERSION,
    reviewKind: kind,
  };
}

module.exports = {
  REVIEWS_VERSION,
  generateProductReviews,
  detectProductKind,
  shortName,
};
