/**
 * Sipariş numarası: NT00001, NT00002, … (5 haneli)
 */

const COUNTER_KEY = 'order-seq';
const PAD_LENGTH = 5;

function parseOrderSequence(orderNumber) {
  const s = String(orderNumber || '').trim().toUpperCase().replace(/\s/g, '');
  const m = s.match(/^NT-?(\d+)$/);
  if (m) return parseInt(m[1], 10) || 0;
  return 0;
}

function formatOrderNumber(seq) {
  const n = Math.max(1, Math.floor(Number(seq) || 0));
  return `NT${String(n).padStart(PAD_LENGTH, '0')}`;
}

/** Müşteri girişi: NT1, NT-00042, nt00042 → NT00042 */
function normalizeOrderNumberInput(input) {
  const s = String(input || '').trim().toUpperCase().replace(/\s/g, '');
  const m = s.match(/^NT-?(\d+)$/);
  if (m) return formatOrderNumber(parseInt(m[1], 10));
  return s;
}

function maxSeqFromIndex(index) {
  if (!Array.isArray(index)) return 0;
  return index.reduce((max, row) => {
    const n = parseOrderSequence(row.orderNumber);
    return n > max ? n : max;
  }, 0);
}

function orderNumbersMatch(stored, input) {
  const a = String(stored || '').trim().toUpperCase();
  const b = String(input || '').trim().toUpperCase();
  if (!a || !b) return false;
  if (a === b) return true;
  const na = normalizeOrderNumberInput(a);
  const nb = normalizeOrderNumberInput(b);
  if (na === nb) return true;
  return a.replace(/\s/g, '') === b.replace(/\s/g, '');
}

async function allocateOrderNumber(store) {
  let seq = 0;
  try {
    const data = await store.get(COUNTER_KEY, { type: 'json' });
    if (data && Number.isFinite(Number(data.value))) {
      seq = Number(data.value);
    }
  } catch {
    seq = 0;
  }

  let index = [];
  try {
    index = await store.get('order-index', { type: 'json' });
  } catch {
    index = [];
  }
  seq = Math.max(seq, maxSeqFromIndex(index));

  const next = seq + 1;
  await store.setJSON(COUNTER_KEY, { value: next });
  return formatOrderNumber(next);
}

function allocateOrderNumberFromIndex(index, currentSeq = 0) {
  const seq = Math.max(Number(currentSeq) || 0, maxSeqFromIndex(index));
  const next = seq + 1;
  return { orderNumber: formatOrderNumber(next), nextSeq: next };
}

module.exports = {
  COUNTER_KEY,
  PAD_LENGTH,
  formatOrderNumber,
  parseOrderSequence,
  normalizeOrderNumberInput,
  orderNumbersMatch,
  maxSeqFromIndex,
  allocateOrderNumber,
  allocateOrderNumberFromIndex,
};
