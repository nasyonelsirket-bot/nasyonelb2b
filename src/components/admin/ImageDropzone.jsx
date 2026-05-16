import { useCallback, useState } from 'react';
import { Upload, ImageIcon, Loader2 } from 'lucide-react';

export default function ImageDropzone({
  label = 'Görsel yükle',
  hint = 'Sürükle-bırak veya tıkla (JPG, PNG, WebP)',
  value,
  onChange,
  onFile,
  previewClassName = 'max-h-40 rounded-lg object-contain',
  aspect = 'video',
}) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFiles = useCallback(
    async (files) => {
      const file = files?.[0];
      if (!file) return;
      setLoading(true);
      try {
        const result = await onFile(file);
        onChange?.(result);
      } catch (err) {
        alert(err.message || 'Görsel yüklenemedi');
      } finally {
        setLoading(false);
      }
    },
    [onChange, onFile],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const aspectClass =
    aspect === 'square'
      ? 'aspect-square max-w-[200px]'
      : aspect === 'logo'
        ? 'aspect-[3/1] max-w-xs'
        : 'aspect-video';

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative rounded-xl border-2 border-dashed transition-colors ${aspectClass} w-full flex flex-col items-center justify-center gap-2 p-4 cursor-pointer ${
          dragging ? 'border-brand-500 bg-brand-50' : 'border-brand-200 bg-brand-50/40 hover:border-brand-400'
        }`}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {loading ? (
          <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
        ) : value ? (
          <img src={value} alt="" className={`w-full h-full object-contain ${previewClassName}`} />
        ) : (
          <>
            <Upload className="h-8 w-8 text-brand-400" />
            <span className="text-xs text-center text-gray-500 px-2">{hint}</span>
          </>
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange?.('')}
          className="text-xs text-red-600 hover:underline flex items-center gap-1"
        >
          <ImageIcon className="h-3 w-3" /> Görseli kaldır
        </button>
      )}
    </div>
  );
}
