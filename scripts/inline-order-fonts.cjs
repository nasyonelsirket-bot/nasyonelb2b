/**
 * Sipariş PDF fontlarını sunucu fonksiyonları için base64 olarak gömer (Netlify bundle uyumu).
 */
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '..', 'lib', 'fonts');
const outPath = path.join(__dirname, '..', 'lib', 'fontData.cjs');

const regularPath = path.join(fontsDir, 'Roboto-Regular.ttf');
const boldPath = path.join(fontsDir, 'Roboto-Bold.ttf');

if (!fs.existsSync(regularPath) || !fs.existsSync(boldPath)) {
  console.error('[inline-order-fonts] lib/fonts/Roboto-*.ttf bulunamadı');
  process.exit(1);
}

const regular = fs.readFileSync(regularPath).toString('base64');
const bold = fs.readFileSync(boldPath).toString('base64');

const content = `/* Otomatik üretildi — scripts/inline-order-fonts.cjs */
module.exports = {
  regular: ${JSON.stringify(regular)},
  bold: ${JSON.stringify(bold)},
};
`;

fs.writeFileSync(outPath, content);
console.log('[inline-order-fonts] lib/fontData.cjs hazırlandı');
