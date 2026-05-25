/**
 * Ödeme onayı sonrası katalog stok düşürme (Netlify Blobs b2b-catalog).
 */
const { getCatalogStore } = require('./catalogBlobStore.cjs');

function findProduct(products, item) {
  const id = String(item?.id || '').trim();
  const sku = String(item?.sku || '').trim();
  if (id) {
    const byId = products.find((p) => String(p.id) === id);
    if (byId) return byId;
  }
  if (sku) {
    return products.find((p) => String(p.sku || '') === sku);
  }
  return null;
}

async function deductOrderStock(event, order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (!items.length) {
    return { ok: true, skipped: true, reason: 'Sipariş kalemi yok' };
  }

  const store = getCatalogStore(event);
  const products = await store.get('products', { type: 'json' });
  if (!Array.isArray(products) || !products.length) {
    console.error('[orderStock] products blob bulunamadı veya boş');
    return { ok: false, error: 'Katalog ürünleri okunamadı' };
  }

  let changed = 0;
  for (const item of items) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const product = findProduct(products, item);
    if (!product || product.stock == null) continue;
    const current = Number(product.stock);
    if (!Number.isFinite(current)) continue;
    product.stock = Math.max(0, current - qty);
    changed += 1;
  }

  if (changed > 0) {
    await store.setJSON('products', products);
    await store.set('updatedAt', new Date().toISOString());
    console.log('[orderStock] stok düşürüldü', {
      orderId: order.id,
      productsUpdated: changed,
    });
  }

  return { ok: true, productsUpdated: changed };
}

module.exports = { deductOrderStock };
