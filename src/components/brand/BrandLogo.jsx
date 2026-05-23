import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveLogoUrl, DEFAULT_LOGO } from '@/utils/resolveLogoUrl';

const FALLBACK_LOGO = DEFAULT_LOGO;

/**
 * Site logosu — admin yüklemesi veya varsayılan marka görseli
 */
export default function BrandLogo({
  logoUrl,
  siteName = 'Nasyonel Toys',
  className = '',
  variant = 'header',
}) {
  const [src, setSrc] = useState(() => resolveLogoUrl(logoUrl));
  const imgClass = variant === 'header' ? `site-logo ${className}` : `site-logo-footer ${className}`;

  return (
    <img
      src={src}
      alt={siteName}
      className={imgClass}
      onError={() => {
        if (src !== FALLBACK_LOGO) setSrc(FALLBACK_LOGO);
      }}
    />
  );
}

export function BrandLogoLink({ logoUrl, siteName, className = '' }) {
  return (
    <Link
      to="/"
      className={`brand-logo-link inline-flex shrink-0 items-center self-center ${className}`}
      aria-label={`${siteName || 'Nasyonel Toys'} — Ana sayfa`}
    >
      <BrandLogo logoUrl={logoUrl} siteName={siteName} variant="header" />
    </Link>
  );
}
