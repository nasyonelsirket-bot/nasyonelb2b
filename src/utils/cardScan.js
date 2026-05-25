/** OCR metninden kart numarası, SKT ve isim çıkar */
export function parseCardFromOcrText(text) {
  const raw = String(text || '');
  const result = { card_number: '', expiry_month: '', expiry_year: '', cc_owner: '' };

  const digitRuns = raw.match(/\d[\d\s-]{12,22}\d/g) || [];
  for (const run of digitRuns) {
    const digits = run.replace(/\D/g, '');
    if (digits.length >= 13 && digits.length <= 19) {
      result.card_number = digits.slice(0, 16);
      break;
    }
  }

  const expiryMatch = raw.match(/(?:0[1-9]|1[0-2])\s*[/\-.]\s*(?:\d{2}|\d{4})/);
  if (expiryMatch) {
    const parts = expiryMatch[0].match(/(\d{2})\D+(\d{2,4})/);
    if (parts) {
      result.expiry_month = parts[1];
      result.expiry_year = parts[2].slice(-2);
    }
  }

  const lines = raw
    .split(/\n/)
    .map((line) => line.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((line) => line.length >= 4 && /[A-Za-zğüşıöçĞÜŞİÖÇ]/.test(line));

  const nameLine = lines.find(
    (line) =>
      !/valid|thru|expires|bank|card|visa|master|troy|paytr|platinum|gold|debit|credit/i.test(line) &&
      line.split(' ').length >= 2,
  );
  if (nameLine) {
    result.cc_owner = nameLine.toUpperCase().slice(0, 40);
  }

  return result;
}

/** Kart fotoğrafından OCR ile alanları oku */
export async function scanCardFromImage(file) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, { logger: () => {} });
  try {
    const { data } = await worker.recognize(file);
    return parseCardFromOcrText(data.text);
  } finally {
    await worker.terminate();
  }
}

/** Canvas veya video karesinden OCR */
export async function scanCardFromCanvas(canvas) {
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Görüntü alınamadı'))), 'image/jpeg', 0.92);
  });
  return scanCardFromImage(blob);
}

const CARD_ASPECT = 1.586;

/** Canlı kamera karesinde kart bölgesi analizi */
export function analyzeCardFrame(ctx, width, height) {
  const cardW = Math.round(width * 0.82);
  const cardH = Math.round(cardW / CARD_ASPECT);
  const x = Math.round((width - cardW) / 2);
  const y = Math.round((height - cardH) / 2);

  const imageData = ctx.getImageData(x, y, cardW, cardH);
  const { data } = imageData;
  const pixelCount = data.length / 4;
  let sum = 0;
  let variance = 0;
  let edgeSum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    sum += lum;
  }
  const avg = sum / pixelCount;

  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    variance += (lum - avg) ** 2;
    if (i + 4 < data.length) {
      const next = data[i + 4] * 0.299 + data[i + 5] * 0.587 + data[i + 6] * 0.114;
      edgeSum += Math.abs(lum - next);
    }
  }
  variance /= pixelCount;
  const edgeScore = edgeSum / pixelCount;

  const aligned =
    variance > 120 &&
    edgeScore > 8 &&
    avg > 35 &&
    avg < 230;

  return {
    aligned,
    avg,
    variance,
    edgeScore,
    cardRect: { x, y, w: cardW, h: cardH },
  };
}

export function drawCardGuide(ctx, width, height, { aligned = false } = {}) {
  const cardW = width * 0.82;
  const cardH = cardW / CARD_ASPECT;
  const x = (width - cardW) / 2;
  const y = (height - cardH) / 2;
  const radius = 14;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, cardW, cardH, radius);
  } else {
    ctx.rect(x, y, cardW, cardH);
  }
  ctx.clip();
  ctx.clearRect(x, y, cardW, cardH);
  ctx.restore();

  ctx.strokeStyle = aligned ? '#34d399' : '#fbbf24';
  ctx.lineWidth = aligned ? 4 : 3;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, cardW, cardH, radius);
  } else {
    ctx.rect(x, y, cardW, cardH);
  }
  ctx.stroke();

  const corner = 22;
  ctx.lineWidth = 5;
  const corners = [
    [x, y, 1, 1],
    [x + cardW, y, -1, 1],
    [x, y + cardH, 1, -1],
    [x + cardW, y + cardH, -1, -1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * corner);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * corner, cy);
    ctx.stroke();
  }
}

export { CARD_ASPECT };
