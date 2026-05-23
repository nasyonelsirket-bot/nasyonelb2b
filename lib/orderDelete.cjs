/**
 * Sipariş kaydını kalıcı olarak siler (blob + liste indeksi).
 */
async function deleteOrderFromStore(store, id) {
  const orderId = String(id || '').trim();
  if (!orderId) {
    throw new Error('Sipariş id gerekli');
  }

  const key = `order-${orderId}`;
  try {
    await store.delete(key);
  } catch {
    /* blob zaten silinmiş olabilir */
  }

  let index = [];
  try {
    index = await store.get('order-index', { type: 'json' });
  } catch {
    index = [];
  }
  if (!Array.isArray(index)) index = [];

  const next = index.filter((row) => row.id !== orderId);
  await store.setJSON('order-index', next);

  return { ok: true, id: orderId };
}

function deleteOrderFromFilesystem(ordersDir, id, fs) {
  const orderId = String(id || '').trim();
  if (!orderId) {
    throw new Error('Sipariş id gerekli');
  }

  const jsonPath = `${ordersDir}/${orderId}.json`;
  try {
    if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
  } catch {
    /* ignore */
  }

  const indexPath = `${ordersDir}/_index.json`;
  let index = [];
  try {
    if (fs.existsSync(indexPath)) index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch {
    index = [];
  }
  if (!Array.isArray(index)) index = [];

  const next = index.filter((row) => row.id !== orderId);
  fs.writeFileSync(indexPath, JSON.stringify(next));

  return { ok: true, id: orderId };
}

module.exports = {
  deleteOrderFromStore,
  deleteOrderFromFilesystem,
};
