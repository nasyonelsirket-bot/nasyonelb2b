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
      !/valid|thru|expires|bank|card|visa|master|troy|paytr/i.test(line) &&
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
