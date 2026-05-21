import { Helmet } from 'react-helmet-async';
import { useStore } from '@/context/StoreContext';
import { getProductMetaDescription, getProductCanonical } from '@/utils/productSeo';
import { getCompareAtPrice, hasProductDiscount } from '@/utils/productPricing';

export default function ProductSchema({ product }) {
  const { settings } = useStore();
  const siteUrl = settings.siteUrl || '';
  const productUrl = getProductCanonical(product, siteUrl);
  const price = Number(product.price) || 0;
  const compare = getCompareAtPrice(product);

  const offers = {
    '@type': 'Offer',
    price,
    priceCurrency: 'TRY',
    availability: 'https://schema.org/InStock',
    url: productUrl,
    itemCondition: 'https://schema.org/NewCondition',
  };

  if (hasProductDiscount(product) && compare > price) {
    offers.priceSpecification = {
      '@type': 'UnitPriceSpecification',
      price,
      priceCurrency: 'TRY',
      referenceQuantity: { '@type': 'QuantitativeValue', value: 1 },
    };
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: getProductMetaDescription(product, settings),
    image: product.image,
    url: productUrl,
    offers,
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
