/** Ürün path — feed için (CJS) */
function slugify(text) {
  const map = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
  return String(text || '')
    .trim()
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (ch) => map[ch] || ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getProductPath(product) {
  const slug = product?.slug || slugify(product?.name) || product?.id;
  return `/urun/${slug}`;
}

module.exports = { getProductPath, slugify };
