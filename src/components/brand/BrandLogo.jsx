import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveLogoUrl, resolveHeaderLogoUrl, DEFAULT_LOGO } from '@/utils/resolveLogoUrl';

/**
 * Site logosu — header’da resmi PNG, diğer yerlerde ayar veya varsayılan
 */
export default function BrandLogo({
  logoUrl,
  siteName = 'Nasyonel Toys',
  className = '',
  variant = 'header',
}) {
  const isHeader = variant === 'header';
  const initial = isHeader ? resolveHeaderLogoUrl(logoUrl) : resolveLogoUrl(logoUrl);
  const [src, setSrc] = useState(initial);
  const imgClass = isHeader
    ? `site-logo site-logo--header ${className}`.trim()
    : `site-logo-footer ${className}`.trim();

  return (
    <img
      src={src}
      alt={siteName}
      className={imgClass}
      width={321}
      height={131}
      decoding="async"
      onError={() => {
        if (src !== DEFAULT_LOGO) setSrc(DEFAULT_LOGO);
      }}
    />
  );
}

export function BrandLogoLink({ logoUrl, siteName, className = '' }) {
  return (
    <Link
      to="/"
      className={`brand-logo-link brand-logo-link--header inline-flex shrink-0 items-center ${className}`}
      aria-label={`${siteName || 'Nasyonel Toys'} — Ana sayfa`}
    >
      <BrandLogo logoUrl={logoUrl} siteName={siteName} variant="header" />
    </Link>
  );
}
