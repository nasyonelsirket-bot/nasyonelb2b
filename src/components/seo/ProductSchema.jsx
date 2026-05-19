import { Helmet } from 'react-helmet-async';
import { useStore } from '@/context/StoreContext';
import { getProductMetaDescription, getProductCanonical } from '@/utils/productSeo';

export default function ProductSchema({ product }) {
  const { settings } = useStore();
  const siteUrl = settings.siteUrl || '';
  const productUrl = getProductCanonical(product, siteUrl);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: getProductMetaDescription(product, settings),
    image: product.image,
    url: productUrl,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'TRY',
      availability: 'https://schema.org/InStock',
      url: productUrl,
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
