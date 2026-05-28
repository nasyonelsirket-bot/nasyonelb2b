import { Helmet } from 'react-helmet-async';
import { getSiteUrl } from '@/utils/canonicalSiteUrl';
import { useStore } from '@/context/StoreContext';

export default function ArticleSchema({ post }) {
  const { settings } = useStore();
  const siteUrl = getSiteUrl(settings);
  if (!post) return null;

  const url = `${siteUrl}/blog/${post.slug}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      '@type': 'Organization',
      name: settings.siteName || 'Nasyonel Toys',
    },
    publisher: {
      '@type': 'Organization',
      name: settings.siteName || 'Nasyonel Toys',
      url: siteUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
