import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { scanCardFromImage } from '@/utils/cardScan';

export default function CardScanButton({ onScan, disabled }) {
  const inputRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setScanning(true);
    setError('');
    try {
      const parsed = await scanCardFromImage(file);
      if (!parsed.card_number) {
        setError('Kart numarası okunamadı. Işığı artırıp tekrar deneyin.');
        return;
      }
      onScan(parsed);
    } catch {
      setError('Kart okunamadı. Elle girmeyi deneyin.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        disabled={disabled || scanning}
        onClick={() => inputRef.current?.click()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/60 px-4 py-3 text-sm font-medium text-brand-800 hover:border-accent-gold hover:bg-accent-gold/10 transition-colors disabled:opacity-60"
      >
        {scanning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Kart okunuyor…
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" />
            Kartı tara / fotoğraf çek
          </>
        )}
      </button>
      {error && <p className="text-xs text-amber-700">{error}</p>}
    </div>
  );
}
