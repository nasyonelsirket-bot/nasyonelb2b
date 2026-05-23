import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveLogoUrl } from '@/utils/resolveLogoUrl';

function isCustomLogo(url) {
  const u = String(url || '').trim();
  if (!u) return false;
  if (u.startsWith('data:')) return true;
  if (u.includes('nasyonel-logo.png')) return false;
  if (u === '/logo.svg' || u.endsWith('/logo.svg')) return false;
  return true;
}

/**
 * Referans tasarımdaki 3D metin logo — görsel yoksa veya varsayılan logo yolundaysa kullanılır
 */
export default function BrandLogo({ logoUrl, siteName = 'Nasyonel Toys', className = '', variant = 'header' }) {
  const [imgFailed, setImgFailed] = useState(false);
  const custom = isCustomLogo(logoUrl) && !imgFailed;
  const src = resolveLogoUrl(logoUrl);

  if (custom) {
    return (
      <img
        src={src}
        alt={siteName}
        className={variant === 'header' ? `site-logo ${className}` : `site-logo-footer ${className}`}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <span
      className={`brand-logo-3d ${variant === 'footer' ? 'brand-logo-3d--footer' : ''} ${className}`}
      aria-label={siteName}
    >
      <span className="brand-logo-3d__nasyonel">Nasyonel</span>
      <span className="brand-logo-3d__toys">Toys</span>
    </span>
  );
}

export function BrandLogoLink({ logoUrl, siteName, className = '' }) {
  return (
    <Link to="/" className={`brand-logo-link inline-flex shrink-0 ${className}`} aria-label={`${siteName || 'Nasyonel Toys'} — Ana sayfa`}>
      <BrandLogo logoUrl={logoUrl} siteName={siteName} />
    </Link>
  );
}
