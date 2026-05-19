import robotoRegularUrl from '@/assets/fonts/Roboto-Regular.ttf?url';
import robotoBoldUrl from '@/assets/fonts/Roboto-Bold.ttf?url';

const FONT_REGULAR = 'Roboto';
const FONT_BOLD = 'RobotoBold';
const VFS_REGULAR = 'Roboto-Regular.ttf';
const VFS_BOLD = 'Roboto-Bold.ttf';

let fontCache = null;

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function fetchFontBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Font yüklenemedi');
  return arrayBufferToBase64(await res.arrayBuffer());
}

async function loadFonts() {
  if (fontCache) return fontCache;
  const [regular, bold] = await Promise.all([
    fetchFontBase64(robotoRegularUrl),
    fetchFontBase64(robotoBoldUrl),
  ]);
  fontCache = { regular, bold };
  return fontCache;
}

/** jsPDF + autotable için Türkçe (ğüşıöç) destekli Roboto */
export async function registerPdfFonts(doc) {
  const { regular, bold } = await loadFonts();
  doc.addFileToVFS(VFS_REGULAR, regular);
  doc.addFileToVFS(VFS_BOLD, bold);
  doc.addFont(VFS_REGULAR, FONT_REGULAR, 'normal', undefined, 'Identity-H');
  doc.addFont(VFS_BOLD, FONT_BOLD, 'normal', undefined, 'Identity-H');
  doc.setFont(FONT_REGULAR, 'normal');
  return { regular: FONT_REGULAR, bold: FONT_BOLD };
}

export function setPdfFont(doc, weight = 'normal') {
  doc.setFont(weight === 'bold' ? FONT_BOLD : FONT_REGULAR, 'normal');
}

export const PDF_FONT = {
  regular: FONT_REGULAR,
  bold: FONT_BOLD,
};
