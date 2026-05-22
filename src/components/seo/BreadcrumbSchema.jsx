import { Helmet } from 'react-helmet-async';
import { useStore } from '@/context/StoreContext';

export default function BreadcrumbSchema({ items }) {
  const { settings } = useStore();
  const siteUrl = (settings.siteUrl || '').replace(/\/$/, '');
  const list = Array.isArray(items) ? items : [];
  if (!list.length || !siteUrl) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.href?.startsWith('http') ? item.href : `${siteUrl}${item.href || ''}`,
    })),
  };

  return (
    <Helmet>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </Helmet>
  );
}
