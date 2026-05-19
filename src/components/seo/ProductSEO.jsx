import SEO from '@/components/seo/SEO';
import { useStore } from '@/context/StoreContext';
import {
  getProductMetaTitle,
  getProductMetaDescription,
  getProductCanonical,
  getProductPath,
} from '@/utils/productSeo';

/**
 * Ürün detay sayfası <head> SEO etiketleri
 * Open Graph / Twitter: SEO.jsx üzerinden (ileride genişletilebilir)
 */
export default function ProductSEO({ product }) {
  const { settings } = useStore();
  const siteName = settings.siteName || 'Nasyonel Toys';
  const siteUrl = settings.siteUrl || import.meta.env.VITE_SITE_URL || '';
  const path = getProductPath(product);
  const metaTitle = getProductMetaTitle(product, siteName);
  const description = getProductMetaDescription(product, settings);
  const canonical = getProductCanonical(product, siteUrl);

  return (
    <SEO
      metaTitle={metaTitle}
      description={description}
      canonical={canonical}
      path={path}
      image={product?.image}
      type="product"
      skipOrganizationSchema
    />
  );
}
