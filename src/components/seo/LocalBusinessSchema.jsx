import { Helmet } from 'react-helmet-async';
import { useStore } from '@/context/StoreContext';
import { COMPANY_ADDRESS } from '@/constants/companyInfo';
import { getSiteUrl } from '@/utils/canonicalSiteUrl';

export default function LocalBusinessSchema() {
  const { settings } = useStore();
  const siteUrl = getSiteUrl(settings);
  const siteName = settings.siteName || 'Nasyonel Toys';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: siteName,
    url: siteUrl || undefined,
    image: settings.logoUrl ? `${siteUrl}${settings.logoUrl.startsWith('/') ? '' : '/'}${settings.logoUrl}` : undefined,
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
    description: settings.tagline || 'Online oyuncak mağazası',
    priceRange: '₺₺',
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
