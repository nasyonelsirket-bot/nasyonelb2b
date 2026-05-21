const PALETTES = [
  { bg: 'bg-gradient-to-br from-orange-500 to-amber-500', text: 'text-white', border: 'border-orange-300' },
  { bg: 'bg-gradient-to-br from-sky-500 to-blue-600', text: 'text-white', border: 'border-sky-300' },
  { bg: 'bg-gradient-to-br from-emerald-500 to-teal-600', text: 'text-white', border: 'border-emerald-300' },
  { bg: 'bg-gradient-to-br from-violet-500 to-purple-600', text: 'text-white', border: 'border-violet-300' },
  { bg: 'bg-gradient-to-br from-rose-500 to-pink-600', text: 'text-white', border: 'border-rose-300' },
  { bg: 'bg-gradient-to-br from-amber-500 to-yellow-500', text: 'text-brand-950', border: 'border-amber-300' },
  { bg: 'bg-gradient-to-br from-cyan-500 to-blue-500', text: 'text-white', border: 'border-cyan-300' },
  { bg: 'bg-gradient-to-br from-indigo-600 to-brand-900', text: 'text-white', border: 'border-indigo-300' },
];

function hashName(name) {
  let h = 0;
  const s = String(name || '');
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function getCategoryStyle(name, index = 0) {
  const i = (hashName(name) + index) % PALETTES.length;
  return PALETTES[i];
}
