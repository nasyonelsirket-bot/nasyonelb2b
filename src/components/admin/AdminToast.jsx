import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function AdminToast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  const isError = type === 'error';

  return (
    <div
      role="alert"
      className={
        'fixed top-4 left-1/2 z-[9999] flex w-[min(92vw,420px)] -translate-x-1/2 items-start gap-3 rounded-xl px-4 py-3 shadow-lg border ' +
        (isError
          ? 'bg-red-50 border-red-200 text-red-900'
          : 'bg-emerald-50 border-emerald-200 text-emerald-900')
      }
    >
      {isError ? (
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
      ) : (
        <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
      )}
      <p className="flex-1 text-sm font-medium pt-0.5">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
        aria-label="Kapat"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
