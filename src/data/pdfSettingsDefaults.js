export const DEFAULT_PDF_SETTINGS = {
  logoUrl: '',
  headerTitle: '',
  docTitle: 'Sipariş Formu',
  showLogo: true,
  showDate: true,
  showCustomer: true,
  showSkuColumn: true,
  showSummary: true,
  showKdvNote: true,
  showFooter: true,
  primaryColor: '#0a1f4d',
  footerText: 'Sipariş onayı için lütfen yanıtlayınız. Teşekkürler.',
  kdvText: '* Tüm fiyatlara KDV dahil değildir.',
  logoWidthMm: 45,
  logoHeightMm: 18,
  marginLeftMm: 14,
  marginTopMm: 14,
  sectionGapMm: 6,
  fontSizeTitle: 17,
  fontSizeSubtitle: 11,
  fontSizeBody: 10,
  fontSizeSmall: 9,
  customerLabels: {
    companyName: 'Firma / Bayi',
    contactName: 'Yetkili',
    phone: 'Telefon',
    address: 'Adres',
  },
};

export function mergePdfSettings(raw) {
  const base = DEFAULT_PDF_SETTINGS;
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    ...base,
    ...src,
    customerLabels: {
      ...base.customerLabels,
      ...(src.customerLabels || {}),
    },
  };
}
