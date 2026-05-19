/**
 * Google arama sonucu canlı önizlemesi
 * İleride Open Graph önizlemesi için genişletilebilir
 */

function displayHost(siteUrl) {
  try {
    const url = String(siteUrl || '').trim();
    if (!url) return 'nasyoneltoys.com';
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return 'nasyoneltoys.com';
  }
}

export default function GoogleSearchPreview({
  title,
  url,
  description,
  siteUrl,
}) {
  const host = displayHost(siteUrl);
  const displayUrl = String(url || '').replace(/^https?:\/\//, '').replace(/\/$/, '') || `${host}/urun/...`;
  const displayTitle = title?.trim() || 'Sayfa başlığı';
  const displayDesc =
    description?.trim() ||
    'Meta açıklama burada görünür. Ürününüzün Google’daki özet metni için bu alanı doldurun.';

  return (
    <div
      className="rounded-xl border border-brand-100 bg-white p-4 shadow-sm"
      aria-label="Google arama önizlemesi"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-3">
        Google önizleme
      </p>
      <div className="max-w-xl font-[Arial,sans-serif]">
        <p className="text-sm text-[#202124] leading-snug truncate">{displayTitle}</p>
        <p className="text-xs text-[#006621] mt-0.5 truncate">
          {host} › {displayUrl.replace(`${host}/`, '').replace(`${host}`, '')}
        </p>
        <p className="text-[13px] text-[#4d5156] mt-1 line-clamp-2 leading-snug">{displayDesc}</p>
      </div>
    </div>
  );
}
