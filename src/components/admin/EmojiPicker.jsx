import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { CATEGORY_EMOJIS, filterEmojis, suggestEmojiForName } from '@/data/categoryEmojis';

export default function EmojiPicker({ value, onChange, categoryName = '', autoSuggest = false }) {
  const [query, setQuery] = useState('');
  const [manualPick, setManualPick] = useState(false);

  const results = useMemo(() => filterEmojis(query), [query]);

  useEffect(() => {
    if (!autoSuggest || manualPick || !categoryName.trim()) return;
    const suggested = suggestEmojiForName(categoryName);
    if (suggested !== value) onChange?.(suggested);
  }, [categoryName, autoSuggest, manualPick, onChange, value]);

  const pick = (emoji) => {
    setManualPick(true);
    onChange?.(emoji);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-600">Kategori emojisi</label>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 border border-brand-200 text-2xl shrink-0">
          {value || '📦'}
        </span>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Emoji ara (örn: araba, bebek, puzzle)"
            className="w-full rounded-lg border border-brand-200 pl-9 pr-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>
      </div>
      <div className="max-h-36 overflow-y-auto rounded-xl border border-brand-100 bg-brand-50/30 p-2">
        <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
          {(results.length ? results : CATEGORY_EMOJIS).map((item) => (
            <button
              key={item.emoji}
              type="button"
              title={item.keywords.slice(0, 3).join(', ')}
              onClick={() => pick(item.emoji)}
              className={`h-9 w-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                value === item.emoji
                  ? 'bg-brand-600 ring-2 ring-brand-400 ring-offset-1'
                  : 'hover:bg-white hover:shadow-sm'
              }`}
            >
              {item.emoji}
            </button>
          ))}
        </div>
        {query && !results.length && (
          <p className="text-xs text-gray-500 text-center py-2">Sonuç yok — farklı kelime deneyin</p>
        )}
      </div>
      {!manualPick && categoryName.trim() && autoSuggest && (
        <p className="text-xs text-brand-600">
          Öneri: kategori adına göre otomatik seçildi. Elle değiştirmek için emojiye tıklayın.
        </p>
      )}
    </div>
  );
}
