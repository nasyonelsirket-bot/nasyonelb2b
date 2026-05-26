import { Helmet } from 'react-helmet-async';
import { GOOGLE_SITE_VERIFICATION } from '@/constants/siteVerification';
import {
  SITE_NAME,
  DEFAULT_META_TITLE,
  DEFAULT_META_DESCRIPTION,
  DEFAULT_OG_IMAGE_PATH,
  FAVICON_PATH,
  APPLE_TOUCH_ICON_PATH,
} from '@/constants/siteSeo';
import { CANONICAL_SITE_URL } from '@/utils/canonicalSiteUrl';

/** Tüm rotalarda kalıcı doğrulama, favicon ve varsayılan sosyal meta */
export default function GlobalSiteHead() {
  const ogImage = `${CANONICAL_SITE_URL}${DEFAULT_OG_IMAGE_PATH}`;

  return (
    <Helmet prioritizeSeoTags>
      <html lang="tr" />
      <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} />
      <meta name="application-name" content={SITE_NAME} />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
      <meta name="format-detection" content="telephone=no" />

      <link rel="icon" type="image/svg+xml" href={FAVICON_PATH} />
      <link rel="apple-touch-icon" href={APPLE_TOUCH_ICON_PATH} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="tr_TR" />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={`${SITE_NAME} logosu`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={ogImage} />

      {/* SPA yüklenmeden önce tarayıcı / bot önizlemesi */}
      <title>{DEFAULT_META_TITLE}</title>
      <meta name="description" content={DEFAULT_META_DESCRIPTION} />
      <meta property="og:title" content={DEFAULT_META_TITLE} />
      <meta property="og:description" content={DEFAULT_META_DESCRIPTION} />
      <meta property="og:url" content={`${CANONICAL_SITE_URL}/`} />
      <meta name="twitter:title" content={DEFAULT_META_TITLE} />
      <meta name="twitter:description" content={DEFAULT_META_DESCRIPTION} />
    </Helmet>
  );
}
