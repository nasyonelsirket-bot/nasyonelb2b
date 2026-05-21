const DEFAULT_PDF_SETTINGS = {
  logoUrl: '',
  headerTitle: '',
  docTitle: 'Sipariş Formu',
  showLogo: false,
  showDate: true,
  showCustomer: true,
  showSkuColumn: true,
  showSummary: true,
  showKdvNote: false,
  showFooter: true,
  primaryColor: '#0a1f4d',
  footerText: 'Sipariş onayı için lütfen yanıtlayınız. Teşekkürler.',
  kdvText: '',
  logoWidthMm: 45,
  logoHeightMm: 18,
  marginLeftMm: 14,
  marginTopMm: 14,
  sectionGapMm: 6,
  fontSizeTitle: 18,
  fontSizeSubtitle: 12,
  fontSizeBody: 11,
  fontSizeSmall: 10,
  customerLabels: {
    companyName: 'Ad Soyad',
    contactName: 'E-posta',
    phone: 'Telefon',
    address: 'Adres',
  },
};

function mergePdfSettings(raw) {
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

module.exports = { DEFAULT_PDF_SETTINGS, mergePdfSettings };
