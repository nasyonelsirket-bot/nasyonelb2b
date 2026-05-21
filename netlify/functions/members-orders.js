const { createBlobStorage, verifyMemberAccess } = require('../../lib/members.cjs');
const { readMemberAuth } = require('../../lib/memberRequestAuth.cjs');
const {
  listOrdersForMemberEmail,
  getOrderDetailForMember,
} = require('../../lib/memberOrders.cjs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Member-Id, X-Member-Email',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { memberId, email } = readMemberAuth(event);
  if (!memberId || !email) {
    return { statusCode: 401, headers: HEADERS, body: JSON.stringify({ error: 'Giriş gerekli' }) };
  }

  try {
    const storage = createBlobStorage(event);
    const member = await verifyMemberAccess(storage, memberId, email);
    if (!member) {
      return { statusCode: 403, headers: HEADERS, body: JSON.stringify({ error: 'Oturum geçersiz' }) };
    }

    const params = event.queryStringParameters || {};
    const orderId = String(params.id || '').trim();

    if (orderId) {
      const order = await getOrderDetailForMember(event, orderId, member.email);
      if (!order) {
        return { statusCode: 404, headers: HEADERS, body: JSON.stringify({ error: 'Sipariş bulunamadı' }) };
      }
      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({ ok: true, order }),
      };
    }

    const orders = await listOrdersForMemberEmail(event, member.email);
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ ok: true, orders, count: orders.length }),
    };
  } catch (err) {
    console.error('members-orders:', err);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message || 'Siparişler alınamadı' }),
    };
  }
};
