import { Helmet } from 'react-helmet-async';
import { useStore } from '@/context/StoreContext';

export default function ProductSchema({ product }) {
  const { settings } = useStore();
  const siteUrl = settings.siteUrl || '';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: product.description,
    image: product.image,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'TRY',
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/urun/${product.id}`,
    },
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
