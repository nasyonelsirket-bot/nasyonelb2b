import { Helmet } from 'react-helmet-async';
import { useStore } from '@/context/StoreContext';
import { getSiteUrl, rewriteUrlToCanonical } from '@/utils/canonicalSiteUrl';
import {
  SITE_NAME,
  DEFAULT_META_TITLE,
  DEFAULT_META_DESCRIPTION,
  DEFAULT_OG_IMAGE_PATH,
} from '@/constants/siteSeo';

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
  const siteName = settings.siteName || SITE_NAME;
  const siteUrl = getSiteUrl(settings);
  const fullTitle =
    metaTitle?.trim() ||
    (title ? `${title} | ${siteName}` : DEFAULT_META_TITLE);
  const desc =
    description?.trim() ||
    settings.tagline?.trim() ||
    DEFAULT_META_DESCRIPTION;
  const ogImage = image?.startsWith('http')
    ? image
    : image
      ? `${siteUrl}${image.startsWith('/') ? image : `/${image}`}`
      : `${siteUrl}${DEFAULT_OG_IMAGE_PATH}`;
  const canonical = canonicalOverride?.trim()
    ? rewriteUrlToCanonical(canonicalOverride)
    : `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const onlineStoreSchema = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: siteName,
    url: siteUrl,
    logo: settings.logoUrl
      ? `${siteUrl}${String(settings.logoUrl).startsWith('/') ? '' : '/'}${settings.logoUrl}`
      : `${siteUrl}${DEFAULT_OG_IMAGE_PATH}`,
    image: ogImage,
    description: desc,
    telephone: settings.contactPhone,
    email: settings.contactEmail,
    priceRange: '₺₺',
    currenciesAccepted: 'TRY',
    paymentAccepted: 'Credit Card',
    areaServed: { '@type': 'Country', name: 'Turkey' },
    address: settings.contactAddress
      ? {
          '@type': 'PostalAddress',
          streetAddress: settings.contactAddress,
          addressLocality: 'İstanbul',
          addressCountry: 'TR',
        }
      : undefined,
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/?q={search_term_string}#urunler`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {!noindex && <meta name="robots" content="index,follow,max-image-preview:large" />}
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
            dangerouslySetInnerHTML={{ __html: JSON.stringify(onlineStoreSchema) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
          />
        </>
      )}
    </Helmet>
  );
}
