import { Helmet } from 'react-helmet-async';
import { useStore } from '@/context/StoreContext';

export default function SEO({
  title,
  metaTitle,
  description,
  image,
  path = '',
  canonical: canonicalOverride,
  type = 'website',
  noindex = false,
  skipOrganizationSchema = false,
}) {
  const { settings } = useStore();
  const siteName = settings.siteName || 'Nasyonel Toys';
  const siteUrl = settings.siteUrl || import.meta.env.VITE_SITE_URL || '';
  const fullTitle =
    metaTitle?.trim() ||
    (title ? `${title} | ${siteName}` : `${siteName} - ${settings.tagline}`);
  const desc = description || settings.tagline;
  const ogImage = image || `${siteUrl}/logo.svg`;
  const base = siteUrl.replace(/\/$/, '');
  const canonical =
    canonicalOverride?.trim() ||
    (base ? `${base}${path}` : path);

  const organizationSchema = {
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

  const websiteSchema = base
    ? {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteName,
        url: siteUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${base}/?q={search_term_string}#urunler`,
          },
          'query-input': 'required name=search_term_string',
        },
      }
    : null;

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

      {!noindex && !skipOrganizationSchema && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
          />
          {websiteSchema && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
          )}
        </>
      )}
    </Helmet>
  );
}
