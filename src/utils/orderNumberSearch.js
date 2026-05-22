/** Admin / takip araması — sipariş no eşleştirme */

export function normalizeOrderNumberQuery(input) {
  const s = String(input || '').trim().toUpperCase().replace(/\s/g, '');
  const m = s.match(/^NT-?(\d+)$/);
  if (m) return `NT${String(parseInt(m[1], 10)).padStart(5, '0')}`;
  return s;
}

export function matchesOrderNumberSearch(order, query) {
  const q = String(query || '').trim();
  if (!q) return true;

  const stored = String(order?.orderNumber || order?.id || '').toUpperCase();
  const raw = q.toUpperCase().replace(/\s/g, '');
  if (stored.includes(raw)) return true;

  const normalizedQuery = normalizeOrderNumberQuery(q);
  const normalizedStored = normalizeOrderNumberQuery(stored);
  if (normalizedStored && normalizedStored.includes(normalizedQuery)) return true;

  return stored.replace(/^NT-/, 'NT').includes(raw.replace(/^NT-/, 'NT'));
}

export function matchesCustomerNameSearch(order, query) {
  const q = String(query || '').trim().toLocaleLowerCase('tr');
  if (!q) return true;
  const name = String(order?.customerName || '').toLocaleLowerCase('tr');
  const email = String(order?.customerEmail || '').toLocaleLowerCase('tr');
  return name.includes(q) || email.includes(q);
}
