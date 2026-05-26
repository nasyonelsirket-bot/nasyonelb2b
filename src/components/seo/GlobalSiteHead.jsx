import { Helmet } from 'react-helmet-async';
import { GOOGLE_SITE_VERIFICATION } from '@/constants/siteVerification';

/** Tüm rotalarda kalıcı site doğrulama meta etiketleri */
export default function GlobalSiteHead() {
  return (
    <Helmet>
      <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} />
    </Helmet>
  );
}
