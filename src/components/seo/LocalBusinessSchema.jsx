import { Helmet } from 'react-helmet-async';
import { useStore } from '@/context/StoreContext';
import { COMPANY_ADDRESS } from '@/constants/companyInfo';
import { getSiteUrl } from '@/utils/canonicalSiteUrl';
import { DEFAULT_META_DESCRIPTION, DEFAULT_OG_IMAGE_PATH, SITE_NAME } from '@/constants/siteSeo';

export default function LocalBusinessSchema() {
  const { settings } = useStore();
  const siteUrl = getSiteUrl(settings);
  const siteName = settings.siteName || SITE_NAME;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: siteName,
    url: siteUrl,
    image: settings.logoUrl
      ? `${siteUrl}${settings.logoUrl.startsWith('/') ? '' : '/'}${settings.logoUrl}`
      : `${siteUrl}${DEFAULT_OG_IMAGE_PATH}`,
    telephone: settings.contactPhone,
    email: settings.contactEmail,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.contactAddress || COMPANY_ADDRESS,
      addressLocality: 'İstanbul',
      addressCountry: 'TR',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '18:00',
    },
    description: settings.tagline || DEFAULT_META_DESCRIPTION,
    priceRange: '₺₺',
    currenciesAccepted: 'TRY',
    paymentAccepted: 'Credit Card',
    areaServed: {
      '@type': 'Country',
      name: 'Turkey',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
