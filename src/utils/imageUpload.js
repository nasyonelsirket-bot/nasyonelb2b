export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.readAsDataURL(file);
  });
}

export async function processImageFile(
  file,
  {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    addBrandBackground = false,
    preserveTransparency = false,
  } = {},
) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('Lütfen bir görsel dosyası seçin (JPG, PNG, WebP)');
  }
  const dataUrl = await readFileAsDataUrl(file);
  return resizeDataUrl(dataUrl, {
    maxWidth,
    maxHeight,
    quality,
    addBrandBackground,
    preserveTransparency,
  });
}

function resizeDataUrl(dataUrl, { maxWidth, maxHeight, quality, addBrandBackground, preserveTransparency }) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      const pad = addBrandBackground ? 20 : 0;
      const canvas = document.createElement('canvas');
      canvas.width = width + pad * 2;
      canvas.height = height + pad * 2;
      const ctx = canvas.getContext('2d');

      if (addBrandBackground) {
        const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grd.addColorStop(0, '#0a1f4d');
        grd.addColorStop(0.5, '#152d5c');
        grd.addColorStop(1, '#1f3a6e');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        const rx = 12;
        const bx = pad - 4;
        const by = pad - 4;
        const bw = width + 8;
        const bh = height + 8;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, rx);
        ctx.fill();
      }

      ctx.drawImage(img, pad, pad, width, height);
      const outType =
        addBrandBackground || preserveTransparency ? 'image/png' : 'image/jpeg';
      resolve(canvas.toDataURL(outType, quality));
    };
    img.onerror = () => reject(new Error('Görsel işlenemedi'));
    img.src = dataUrl;
  });
}
