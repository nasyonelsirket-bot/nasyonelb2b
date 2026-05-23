import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');

/** Şeffaf arka plan + kırpma; retina için 2x dosya üretir */
async function processLogo(inputName, outputName, targetWidth) {
  const inputPath = path.join(publicDir, inputName);
  const outputPath = path.join(publicDir, outputName);

  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < 35 && g < 35 && b < 35) data[i + 3] = 0;
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 12 })
    .resize({ width: targetWidth, withoutEnlargement: false, kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);

  const meta = await sharp(outputPath).metadata();
  console.log(`${outputName}: ${meta.width}x${meta.height}`);
}

const hires = path.join(publicDir, 'nasyonel-logo-hires.png');
const base = path.join(publicDir, 'nasyonel-logo.png');

await processLogo('nasyonel-logo-hires.png', 'nasyonel-logo.png', 420);
await processLogo('nasyonel-logo-hires.png', 'nasyonel-logo@2x.png', 840);

console.log('Logos ready');
