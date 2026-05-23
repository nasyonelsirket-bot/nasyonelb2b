import { Helmet } from 'react-helmet-async';

/**
 * @param {{ items: Array<{ q: string, a: string }> }} props
 */
export default function FaqSchema({ items }) {
  if (!items?.length) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
