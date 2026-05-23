import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.join(__dirname, '../public/nasyonel-logo.png');
const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (r < 35 && g < 35 && b < 35) data[i + 3] = 0;
}

await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .trim({ threshold: 12 })
  .png({ compressionLevel: 9 })
  .toFile(inputPath);

const meta = await sharp(inputPath).metadata();
console.log(`Logo processed: ${meta.width}x${meta.height}`);
