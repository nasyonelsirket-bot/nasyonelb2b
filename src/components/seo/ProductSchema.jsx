import { Helmet } from 'react-helmet-async';
import { useStore } from '@/context/StoreContext';
import { getSiteUrl } from '@/utils/canonicalSiteUrl';
import { SITE_NAME } from '@/constants/siteSeo';
import { getProductMetaDescription, getProductCanonical } from '@/utils/productSeo';
import { getCompareAtPrice, hasProductDiscount } from '@/utils/productPricing';
import { getProductRatingSummary } from '@/utils/productReviews';

export default function ProductSchema({ product }) {
  const { settings } = useStore();
  const siteUrl = getSiteUrl(settings);
  const productUrl = getProductCanonical(product, siteUrl);
  const siteName = settings.siteName || SITE_NAME;
  const price = Number(product.price) || 0;
  const compare = getCompareAtPrice(product);

  const offers = {
    '@type': 'Offer',
    price,
    priceCurrency: 'TRY',
    availability: 'https://schema.org/InStock',
    url: productUrl,
    itemCondition: 'https://schema.org/NewCondition',
    seller: {
      '@type': 'OnlineStore',
      name: siteName,
      url: siteUrl,
    },
  };

  if (hasProductDiscount(product) && compare > price) {
    offers.priceSpecification = {
      '@type': 'UnitPriceSpecification',
      price,
      priceCurrency: 'TRY',
      referenceQuantity: { '@type': 'QuantitativeValue', value: 1 },
    };
  }

  const { avg, count } = getProductRatingSummary(product);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: getProductMetaDescription(product, settings),
    image: product.image,
    url: productUrl,
    brand: {
      '@type': 'Brand',
      name: siteName,
    },
    offers,
  };

  if (count > 0 && avg > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(avg.toFixed(1)),
      reviewCount: count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <Helmet>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </Helmet>
  );
}
