import { Helmet } from 'react-helmet-async';
import { getSiteUrl } from '@/utils/canonicalSiteUrl';
import { getProductPath } from '@/utils/productSeo';
import { useStore } from '@/context/StoreContext';

/** Kategori landing — CollectionPage + ItemList schema */
export default function CategorySchema({ category, products = [] }) {
  const { settings } = useStore();
  const siteUrl = getSiteUrl(settings);
  if (!category) return null;

  const path = `/${category.slug}`;
  const pageUrl = `${siteUrl}${path}`;
  const list = (Array.isArray(products) ? products : []).slice(0, 20);

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category.name,
    description: category.seoDescription,
    numberOfItems: list.length,
    itemListElement: list.map((p, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteUrl}${getProductPath(p)}`,
      name: p.name,
    })),
  };

  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.seoTitle || category.name,
    description: category.seoDescription,
    url: pageUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: settings.siteName || 'Nasyonel Toys',
      url: siteUrl,
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(collection)}</script>
      {list.length > 0 && (
        <script type="application/ld+json">{JSON.stringify(itemList)}</script>
      )}
    </Helmet>
  );
}
