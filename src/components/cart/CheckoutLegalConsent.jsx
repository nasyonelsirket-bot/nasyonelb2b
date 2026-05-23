import { Link } from 'react-router-dom';

/**
 * @param {{ accepted: boolean, onChange: (v: boolean) => void, error?: string }} props
 */
export default function CheckoutLegalConsent({ accepted, onChange, error }) {
  return (
    <div className="rounded-xl border border-brand-100 bg-white p-4 space-y-3">
      <p className="text-xs font-semibold text-brand-800 uppercase tracking-wide">
        Sözleşme onayı
      </p>
      <label className="flex items-start gap-3 cursor-pointer text-sm text-brand-800 leading-relaxed">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-brand-300 text-brand-700 focus:ring-brand-500"
          required
        />
        <span>
          <Link to="/sozlesme/on-bilgilendirme" target="_blank" className="text-brand-700 underline hover:text-brand-900">
            Ön bilgilendirme formunu
          </Link>
          ,{' '}
          <Link to="/sozlesme/mesafeli-satis" target="_blank" className="text-brand-700 underline hover:text-brand-900">
            mesafeli satış sözleşmesini
          </Link>
          ,{' '}
          <Link to="/sozlesme/teslimat-kargo" target="_blank" className="text-brand-700 underline hover:text-brand-900">
            teslimat koşullarını
          </Link>{' '}
          ve{' '}
          <Link to="/sozlesme/kvkk" target="_blank" className="text-brand-700 underline hover:text-brand-900">
            KVKK aydınlatma metnini
          </Link>{' '}
          okudum, kabul ediyorum.
        </span>
      </label>
      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
