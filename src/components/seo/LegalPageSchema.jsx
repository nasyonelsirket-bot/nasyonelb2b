import { Helmet } from 'react-helmet-async';
import { useStore } from '@/context/StoreContext';
import { getSiteUrl } from '@/utils/canonicalSiteUrl';

/**
 * Yasal sayfalar için WebPage + BreadcrumbList schema
 */
export default function LegalPageSchema({ title, description, path, slug }) {
  const { settings } = useStore();
  const siteUrl = getSiteUrl(settings);
  const siteName = settings.siteName || 'Nasyonel Toys';
  if (!siteUrl || !path) return null;

  const pageUrl = `${siteUrl}${path}`;
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: title, item: pageUrl },
    ],
  };

  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: title,
    description: description?.slice(0, 320) || title,
    isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
    inLanguage: 'tr-TR',
    about: {
      '@type': 'Thing',
      name: title,
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
    },
  };

  if (slug === 'teslimat-kargo') {
    webPage['@type'] = ['WebPage', 'FAQPage'];
    webPage.mainEntity = [
      {
        '@type': 'Question',
        name: 'Sipariş ne zaman kargoya verilir?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ödeme onayı sonrası stoktaki ürünler genellikle 1–2 iş günü içinde hazırlanır ve kargoya verilir.',
        },
      },
      {
        '@type': 'Question',
        name: 'Kargo teslim süresi ne kadar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Kargoya verildikten sonra bölgeye göre 1–5 iş günü içinde teslimat hedeflenir.',
        },
      },
      {
        '@type': 'Question',
        name: 'Ücretsiz kargo şartı nedir?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '500 TL ve üzeri siparişlerde kargo bedeli alıcıya yansıtılmaz.',
        },
      },
    ];
  }

  return (
    <Helmet>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPage) }} />
    </Helmet>
  );
}
