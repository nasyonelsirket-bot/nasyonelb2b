/** Görsel hazırlama — admin ve banner alanlarında gösterilir */

export const LOGO_SPEC = {
  width: 480,
  height: 120,
  ratio: '4:1',
  format: 'PNG (şeffaf arka plan)',
  note: 'Beyaz kutu veya çerçeve eklemeyin; sadece logo olsun.',
};

export const BANNER_SPEC = {
  width: 1920,
  height: 800,
  ratio: '12:5',
  format: 'JPG veya PNG',
  safeZone: 'Önemli metin/görsel ortada 1600×640 px içinde kalsın',
  note: 'Tam bu ölçüde hazırlayın; sitede kırpılmaz, kenarlarda koyu şerit kalabilir.',
};

export function logoSpecText() {
  return `${LOGO_SPEC.width}×${LOGO_SPEC.height} px (${LOGO_SPEC.ratio}) · ${LOGO_SPEC.format}`;
}

export function bannerSpecText() {
  return `${BANNER_SPEC.width}×${BANNER_SPEC.height} px (${BANNER_SPEC.ratio}) · ${BANNER_SPEC.format}`;
}
