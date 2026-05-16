import { Helmet } from 'react-helmet-async';
import { useStore } from '@/context/StoreContext';

export default function SEO({
  title,
  description,
  image,
  path = '',
  type = 'website',
  noindex = false,
}) {
  const { settings } = useStore();
  const siteName = settings.siteName || 'ToyWholesale B2B';
  const siteUrl = settings.siteUrl || import.meta.env.VITE_SITE_URL || '';
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - ${settings.tagline}`;
  const desc = description || settings.tagline;
  const ogImage = image || `${siteUrl}/logo.svg`;
  const canonical = `${siteUrl.replace(/\/$/, '')}${path}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    logo: settings.logoUrl,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: settings.contactPhone,
      contactType: 'sales',
      areaServed: 'TR',
      availableLanguage: 'Turkish',
    },
  };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="tr_TR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {!noindex && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
    </Helmet>
  );
}
