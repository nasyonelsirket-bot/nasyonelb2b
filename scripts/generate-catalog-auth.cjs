/**
 * Build sırasında admin şifresini Netlify Functions için lib/catalogAuth.cjs dosyasına yazar.
 * VITE_ADMIN_PASSWORD (Netlify Build env) yeterlidir — ayrı ADMIN_PASSWORD gerekmez.
 */
const fs = require('fs');
const path = require('path');

const pass = String(
  process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || 'admin123',
).trim();

const outPath = path.join(__dirname, '..', 'lib', 'catalogAuth.cjs');
const content = `/** Bu dosya build sırasında otomatik üretilir — elle düzenlemeyin */
module.exports = {
  ADMIN_PASSWORD: ${JSON.stringify(pass)},
};
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, content, 'utf8');
console.log('[generate-catalog-auth] Functions için admin şifresi hazırlandı.');
