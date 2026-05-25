import { useState } from 'react';
import { Camera, ScanLine } from 'lucide-react';
import CardLiveScanner from '@/components/payment/CardLiveScanner';

function formatCardNumber(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export default function CardScanButton({ onScan, disabled }) {
  const [open, setOpen] = useState(false);
  const [lastScan, setLastScan] = useState(null);

  const handleScan = (parsed) => {
    setLastScan(parsed);
    onScan?.(parsed);
    setOpen(false);
  };

  return (
    <>
      <div className="space-y-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-gradient-to-r from-brand-50 to-orange-50/80 px-4 py-3.5 text-sm font-semibold text-brand-800 hover:border-accent-gold hover:shadow-md transition-all disabled:opacity-60"
        >
          <ScanLine className="h-4 w-4 text-accent-gold" />
          <Camera className="h-4 w-4" />
          Kartı canlı tara (OCR)
        </button>
        {lastScan?.card_number && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 text-xs text-emerald-900 space-y-1">
            <p className="font-semibold">Okunan kart (PayTR ekranına girin)</p>
            <p className="font-mono tracking-wide">{formatCardNumber(lastScan.card_number)}</p>
            {(lastScan.expiry_month || lastScan.expiry_year) && (
              <p>
                SKT: {String(lastScan.expiry_month || 'AA').padStart(2, '0')}/
                {String(lastScan.expiry_year || 'YY').padStart(2, '0')}
              </p>
            )}
            {lastScan.cc_owner && <p>{lastScan.cc_owner}</p>}
          </div>
        )}
      </div>
      <CardLiveScanner open={open} onClose={() => setOpen(false)} onScan={handleScan} />
    </>
  );
}
