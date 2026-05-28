/** Ödeme sayfası kart marka rozetleri — hafif, ekstra asset yok */
const BRANDS = [
  { id: 'visa', label: 'Visa', bg: 'bg-[#1A1F71]', text: 'text-white' },
  { id: 'mastercard', label: 'MC', bg: 'bg-[#EB001B]', text: 'text-white' },
  { id: 'troy', label: 'Troy', bg: 'bg-[#005BAC]', text: 'text-white' },
  { id: 'amex', label: 'Amex', bg: 'bg-[#006FCF]', text: 'text-white' },
];

export default function CardBrandIcons({ className = '', size = 'md' }) {
  const sizeClass = size === 'sm' ? 'h-6 min-w-[2.25rem] text-[9px]' : 'h-7 min-w-[2.75rem] text-[10px]';

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}
      aria-label="Kabul edilen kartlar: Visa, Mastercard, Troy, American Express"
    >
      {BRANDS.map(({ id, label, bg, text }) => (
        <span
          key={id}
          className={`inline-flex items-center justify-center rounded-md px-2 font-extrabold uppercase tracking-wide shadow-sm ${sizeClass} ${bg} ${text}`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
